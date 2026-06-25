import requests
import json
import re

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL  # local-dev fallback only; prod uses claude_client.


def _safe_json(response: requests.Response) -> dict:
    try:
        return response.json()
    except ValueError:
        return {}


def _get_available_models() -> list[str]:
    try:
        tags_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        tags_response.raise_for_status()
        tags_json = tags_response.json()
    except requests.exceptions.RequestException:
        return []

    models = tags_json.get("models", []) or []
    names = []
    for item in models:
        name = item.get("name")
        if name:
            names.append(name)
    return names


def _raise_helpful_ollama_error(response: requests.Response) -> None:
    error_data = _safe_json(response)
    error_text = error_data.get("error", "")

    if isinstance(error_text, str) and "model" in error_text and "not found" in error_text:
        available_models = _get_available_models()
        if available_models:
            available = ", ".join(available_models)
            raise RuntimeError(
                f"Ollama model '{OLLAMA_MODEL}' is not available.\n"
                f"Available local models: {available}\n"
                f"Set OLLAMA_MODEL in .env to one of the above."
            )
        raise RuntimeError(
            f"Ollama model '{OLLAMA_MODEL}' is not available.\n"
            f"Pull it first with: ollama pull {OLLAMA_MODEL}"
        )

    response.raise_for_status()


def call_ollama(system_prompt: str, user_message: str) -> str:
    """
    Send a prompt to Ollama and return the raw text response.
    Uses the /api/chat endpoint with a system + user message structure.
    """
    chat_url = f"{OLLAMA_BASE_URL}/api/chat"
    generate_url = f"{OLLAMA_BASE_URL}/api/generate"

    chat_payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "stream": False,        # Get full response at once, not streamed
        "options": {
            "temperature": 0.1, # Low temperature = more consistent, less creative
                                # Important for structured JSON output
        }
    }

    generate_payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"System:\n{system_prompt}\n\nUser:\n{user_message}",
        "stream": False,
        "options": {
            "temperature": 0.1,
        }
    }

    try:
        response = requests.post(chat_url, json=chat_payload, timeout=120)

        # Some Ollama versions do not expose /api/chat and only support /api/generate.
        if response.status_code == 404:
            response = requests.post(generate_url, json=generate_payload, timeout=120)

        if response.status_code >= 400:
            _raise_helpful_ollama_error(response)

        data = _safe_json(response)

        if "message" in data and "content" in data["message"]:
            return data["message"]["content"]
        if "response" in data:
            return data["response"]

        raise RuntimeError(f"Unexpected Ollama response format: {data}")

    except requests.exceptions.ConnectionError:
        raise ConnectionError(
            "Cannot connect to Ollama. "
            "Make sure Ollama is running: open a terminal and run 'ollama serve'"
        )
    except requests.exceptions.Timeout:
        raise TimeoutError(
            "Ollama took too long to respond. "
            "This can happen on first run — try again."
        )
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Ollama request failed: {str(e)}")


def extract_json_from_response(raw_response: str) -> dict:
    """
    Safely extract JSON from the model's response.

    Why this function exists:
    Even with strong instructions, small local models sometimes wrap
    their JSON output in markdown code fences like ```json ... ```
    or add a sentence before the JSON. This function handles all of that.
    """

    # Step 1: Strip leading/trailing whitespace
    cleaned = raw_response.strip()

    # Step 2: Remove markdown code fences if present
    # Handles ```json ... ``` and ``` ... ```
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$',          '', cleaned)
    cleaned = cleaned.strip()

    # Step 3: If the model added text before the JSON, find where JSON starts
    json_start = cleaned.find('{')
    json_end   = cleaned.rfind('}')

    if json_start == -1 or json_end == -1:
        raise ValueError(
            f"No JSON object found in model response.\n"
            f"Raw response was:\n{raw_response[:500]}"
        )

    json_string = cleaned[json_start:json_end + 1]

    # Step 4: Parse the JSON
    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Model returned invalid JSON: {str(e)}\n"
            f"Extracted string was:\n{json_string[:500]}"
        )