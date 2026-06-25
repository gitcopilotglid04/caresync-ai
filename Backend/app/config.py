"""
Central application configuration.

Single source of truth for LLM settings. All secrets are read from the
environment (loaded from a gitignored .env) — never hardcode keys here.

Development policy: keep USE_MOCK_CLAUDE=true so the full app runs on canned,
schema-valid responses with NO real Anthropic API key. Do not put a live
ANTHROPIC_API_KEY in .env during development.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


# --- LLM (Anthropic / Claude) ---------------------------------------------
# Default to mock mode so development never depends on a live key.
USE_MOCK_CLAUDE: bool = _as_bool(os.getenv("USE_MOCK_CLAUDE"), default=True)
ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-opus-4-6")

# --- Ollama (local-dev fallback only) -------------------------------------
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
