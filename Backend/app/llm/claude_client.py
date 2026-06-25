import json
import re

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, USE_MOCK_CLAUDE


def _mock_claude_response(system_prompt: str) -> str:
    """
    Return canned, schema-valid JSON so the full app flow can be tested
    without a real Anthropic API key. Enabled via USE_MOCK_CLAUDE=true.
    The agent is identified from the system prompt text.
    """
    if "patient communication specialist" in system_prompt.lower():
        return json.dumps({
            "patient_name": "Rajesh Kumar",
            "messages": [
                {
                    "day": 1,
                    "channel": "Phone call",
                    "subject": "Welcome home — let's get started",
                    "body": "Hi Rajesh, welcome home. Today, please take all your heart medicines exactly as written: Aspirin, Clopidogrel, Atorvastatin, and your Metformin. A nurse will check in with you to make sure everything is going smoothly.",
                    "warning_signs": [
                        "Call your doctor right away if you feel chest pain, pressure, or shortness of breath",
                        "Get help if you feel dizzy or faint",
                    ],
                    "call_to_action": "Take all your medicines today and answer the nurse's check-in call.",
                },
                {
                    "day": 7,
                    "channel": "WhatsApp",
                    "subject": "Your heart check-up is coming up",
                    "body": "Hi Rajesh, your Cardiology visit with a repeat ECG is due this week. Keep taking your medicines and stick to your low-salt diet. Please bring your medicine list to the appointment.",
                    "warning_signs": [
                        "Call your doctor if you notice swelling in your legs or sudden weight gain",
                    ],
                    "call_to_action": "Attend your Cardiology appointment and bring your medicine list.",
                },
                {
                    "day": 14,
                    "channel": "SMS",
                    "subject": "Two weeks in — how are you doing?",
                    "body": "Hi Rajesh, you're two weeks into recovery. A home nurse will visit to check that your medicines are working and your diet is on track. Keep avoiding heavy activity.",
                    "warning_signs": [
                        "Call your doctor if chest discomfort returns or you feel unusually tired",
                    ],
                    "call_to_action": "Be available for the home nurse visit and keep up your low-salt diet.",
                },
                {
                    "day": 30,
                    "channel": "Email",
                    "subject": "One month check-in",
                    "body": "Hi Rajesh, it's been a month since you left the hospital. Time for a final review of your recovery and medicines. Great job staying on track — let's confirm everything looks good.",
                    "warning_signs": [
                        "Call your doctor if any chest symptoms come back before your review",
                    ],
                    "call_to_action": "Complete your 30-day recovery review with your doctor.",
                },
            ],
        })

    if "clinical risk analyst" in system_prompt.lower():
        return json.dumps({
            "risk_level": "High",
            "risk_factors": [
                "Lives alone with limited family support nearby",
                "Polypharmacy (four or more medications)",
                "Recent cardiac event requiring specialist follow-up",
            ],
            "readmission_probability_percent": 27.5,
            "checkpoint_priorities": [
                {"day": 1, "priority_rank": 1, "rationale": "Earliest window for medication errors and acute deterioration."},
                {"day": 7, "priority_rank": 2, "rationale": "Specialist follow-up and adherence check are time-sensitive."},
                {"day": 14, "priority_rank": 3, "rationale": "Reassess recovery progress and any new symptoms."},
                {"day": 30, "priority_rank": 4, "rationale": "Confirm stable recovery at end of the readmission window."},
            ],
        })

    if "care-coordination triage lead" in system_prompt.lower():
        return json.dumps({
            "human_review_required": True,
            "overall_urgency": "urgent",
            "escalation_items": [
                {
                    "concern": "Patient lives alone with limited support after a cardiac event",
                    "owner": "human_coordinator",
                    "urgency": "urgent",
                    "rationale": "A coordinator must confirm home support before the Day 1 checkpoint.",
                },
                {
                    "concern": "Day 1 medication-adherence reminder",
                    "owner": "AI",
                    "urgency": "soon",
                    "rationale": "Routine reminder the system can send automatically.",
                },
            ],
            "summary": "High-risk cardiac patient living alone needs a human coordinator to confirm home support; routine reminders can be automated.",
            "model_overridden": False,
        })

    return json.dumps({
        "patient_name": "Rajesh Kumar",
        "diagnosis": "NSTEMI (non-ST elevation myocardial infarction)",
        "medications": [
            "Aspirin 75 mg OD",
            "Clopidogrel 75 mg OD",
            "Atorvastatin 40 mg HS",
            "Metformin 500 mg BD",
        ],
        "follow_up_appointments": [
            "Cardiology OPD in 1 week with repeat ECG",
        ],
        "checkpoints": [
            {"day": 1, "action": "Confirm medication adherence and review red-flag symptoms", "responsible_party": "nurse"},
            {"day": 7, "action": "Cardiology OPD visit with repeat ECG", "responsible_party": "doctor"},
            {"day": 14, "action": "Home nurse visit to verify adherence and diet compliance", "responsible_party": "nurse"},
            {"day": 30, "action": "Final recovery review and medication reconciliation", "responsible_party": "doctor"},
        ],
        "complexity_score": 7,
        "complexity_reason": "Recent cardiac event with polypharmacy and limited home support raises care complexity.",
    })


def call_claude(system_prompt: str, user_message: str) -> str:
    """
    Send a prompt to Claude (Anthropic Messages API) and return the raw text.

    Raises:
        ConnectionError: if the API key is missing or the API is unreachable
        RuntimeError: for any other API or SDK failure
    """
    if USE_MOCK_CLAUDE:
        return _mock_claude_response(system_prompt)

    if not ANTHROPIC_API_KEY:
        raise ConnectionError(
            "ANTHROPIC_API_KEY is not set. Add it to your .env file "
            "(get a key at https://console.anthropic.com)."
        )

    try:
        from anthropic import Anthropic, APIConnectionError, APIStatusError
    except ImportError:
        raise RuntimeError(
            "The 'anthropic' package is not installed. Run: pip install anthropic"
        )

    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=16000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
    except APIConnectionError as e:
        raise ConnectionError(f"Cannot reach the Anthropic API: {e}")
    except APIStatusError as e:
        raise RuntimeError(f"Anthropic API error {e.status_code}: {e.message}")

    return "".join(
        block.text
        for block in message.content
        if getattr(block, "type", None) == "text"
    )


def extract_json_from_response(raw_response: str) -> dict:
    """
    Safely extract JSON from the model's response.

    Even with strong instructions, models sometimes wrap their JSON output in
    markdown code fences like ```json ... ``` or add a sentence before the JSON.
    This function handles all of that.
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
