"""LLM clients — the model boundary for the app.

Primary path is Claude (Anthropic). Ollama is a local-dev fallback only.
"""

from app.llm.claude_client import (
    CLAUDE_MODEL,
    call_claude,
    extract_json_from_response,
)

__all__ = ["call_claude", "extract_json_from_response", "CLAUDE_MODEL"]
