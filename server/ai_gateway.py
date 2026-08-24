# server/ai_gateway.py
"""
AI Gateway — BYOK provider utilities for OpenML Flow.

Owns everything provider-related so main.py stays lean:
  • Base URL normalization (fixes common copy-paste mistakes)
  • Field validation (no empty keys/URLs ever reach the database)
  • Connection testing (cheap models.list call — works on every
    OpenAI-compatible API: OpenAI, Groq, OpenRouter, Ollama, LM Studio)
  • Typed error mapping (users see one friendly sentence, never raw HTML)

Exception classes are matched by NAME (type(e).__name__) instead of imports,
so this module never fails at import time regardless of openai SDK version.
"""

from openai import OpenAI

BASE_URL_FIXES = {
    "https://openrouter.ai": "https://openrouter.ai/api/v1",
    "https://openrouter.ai/api": "https://openrouter.ai/api/v1",
    "https://api.groq.com": "https://api.groq.com/openai/v1",
    "https://api.groq.com/v1": "https://api.groq.com/openai/v1",
    "https://api.openai.com": "https://api.openai.com/v1",
    "http://localhost:11434": "http://localhost:11434/v1",
    "http://127.0.0.1:11434": "http://127.0.0.1:11434/v1",
    "http://host.docker.internal:11434": "http://host.docker.internal:11434/v1",
}

PROVIDER_HINTS = (
    "Correct Base URLs:\n"
    "  OpenRouter → https://openrouter.ai/api/v1   (models need vendor prefixes, e.g. 'openai/gpt-4o-mini')\n"
    "  Groq       → https://api.groq.com/openai/v1\n"
    "  OpenAI     → https://api.openai.com/v1\n"
    "  Ollama     → http://localhost:11434/v1   (from Docker: http://host.docker.internal:11434/v1)"
)


class AIGatewayError(Exception):
    """Provider call failed. str(e) is always a short, user-friendly message."""


def normalize_base_url(url: str) -> str:
    url = (url or "").strip().rstrip("/")
    return BASE_URL_FIXES.get(url, url)


def validate_provider_fields(name: str, base_url: str, api_key: str, model: str) -> "str | None":
    """Return an error message, or None when valid."""
    if not (name or "").strip():
        return "Provider name is required."
    if not (base_url or "").strip():
        return "Base URL is required."
    if not (api_key or "").strip():
        return "API key is required."
    if not (model or "").strip():
        return "Model is required."
    if " " in (model or "").strip():
        return ("Model name contains spaces — that is almost certainly wrong. Copy the EXACT model ID "
                "from the provider's model list (e.g. 'openai/gpt-4o-mini' or "
                "'nvidia/llama-3.3-nemotron-super-49b-v1:free' — no spaces).")
    return None


def safe_error_text(e: Exception) -> str:
    """Short human-readable error text — never raw HTML, never huge."""
    raw = ""
    for attr in ("message", "body"):
        val = getattr(e, attr, None)
        if val:
            raw = str(val)
            break
    if not raw:
        raw = str(e)
    low = raw[:300].lower()
    if "<!doctype" in low or "<html" in low or "<head" in low:
        return "the provider returned an HTML page instead of JSON — the Base URL likely points at a website, not the API"
    return raw[:300]


def _map_provider_error(e: Exception, base_url: str, model: str) -> str:
    """Translate an openai SDK exception into one short user-facing sentence."""
    name = type(e).__name__
    if name == "AuthenticationError":
        return f"invalid API key (401) — re-add this provider in Settings → AI Providers with a correct key. (Base URL: {base_url})"
    if name == "PermissionDeniedError":
        return "this API key can't use that model (403). Try another model."
    if name == "NotFoundError":
        return f"endpoint or model not found (404).\nSaved Base URL: {base_url}\nCheck the model name '{model}' is valid.\n{PROVIDER_HINTS}"
    if name == "BadRequestError":
        return f"provider rejected the request (400): {safe_error_text(e)}"
    if name == "RateLimitError":
        return "rate limit / quota exceeded (429). Wait a moment or check the provider account."
    if name == "APIConnectionError":
        return f"could not reach the provider — check the Base URL and network. Detail: {safe_error_text(e)}"
    if name == "APIStatusError":
        status = getattr(e, "status_code", "?")
        return f"provider error (HTTP {status}): {safe_error_text(e)}"
    return f"{name}: {safe_error_text(e)}"


def test_provider_connection(base_url: str, api_key: str, model: str) -> dict:
    """
    Credential check for an OpenAI-compatible API.

    Two steps:
      1. Best-effort models.list() — collects available model IDs. NOTE: some
         providers (e.g. OpenRouter) serve /models publicly WITHOUT auth, so
         a successful list alone proves NOTHING about the key.
      2. A 1-token chat-completion probe — the real credential check. Costs
         effectively nothing and works on every provider (local included).
    Returns {"success": bool, "message": str, "baseUrl": str}.
    """
    base_url = normalize_base_url(base_url)
    api_key = (api_key or "").strip()
    if not api_key:
        return {"success": False, "message": "API key is required.", "baseUrl": base_url}
    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=15.0)

        ids: list = []
        try:
            ids = [m.id for m in client.models.list().data]
        except Exception:
            pass  # gated or absent /models — the chat probe below is authoritative

        probe = (model or "").strip() or (ids[0] if ids else "")
        if not probe:
            return {"success": False, "message": "No model available to test — check the Base URL.", "baseUrl": base_url}

        try:
            client.chat.completions.create(
                model=probe,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
            )
        except Exception as e:
            # HTML response = Base URL points at a website, not the API.
            # Check the RAW error text — exception class alone is unreliable here.
            if "instead of json" in safe_error_text(e).lower():
                return {
                    "success": False,
                    "message": f"the Base URL points at a website, not the API.\n{PROVIDER_HINTS}",
                    "baseUrl": base_url,
                }
            friendly = _map_provider_error(e, base_url, probe)
            err_name = type(e).__name__
            if err_name == "NotFoundError" and model and ids and model not in ids:
                return {
                    "success": False,
                    "message": (
                        f"the key works, but model '{model}' was not found on this provider.\n"
                        f"Copy the EXACT model ID. Examples: {', '.join(ids[:5])}\n{PROVIDER_HINTS}"
                    ),
                    "baseUrl": base_url,
                }
            return {"success": False, "message": friendly, "baseUrl": base_url}

        if model and ids and model not in ids:
            return {
                "success": True,
                "message": f"Connected ✓ — key verified with a live request. Note: '{model}' was not in the provider's model list; double-check the exact ID. Examples: {', '.join(ids[:5])}",
                "baseUrl": base_url,
            }
        return {"success": True, "message": f"Connected ✓ — key verified with a live request ('{probe}').", "baseUrl": base_url}
    except Exception as e:
        return {"success": False, "message": _map_provider_error(e, base_url, model), "baseUrl": base_url}


def chat_with_provider(provider_row, prompt: str, system_prompt: str) -> str:
    """
    Runs a chat completion against a provider row (sqlite3.Row with base_url /
    api_key / model columns). Returns assistant text; raises AIGatewayError
    with a user-friendly message on any failure.
    """
    base_url = (provider_row["base_url"] or "").strip()
    api_key = (provider_row["api_key"] or "").strip()
    model = (provider_row["model"] or "").strip()

    if not api_key:
        raise AIGatewayError(
            "the active provider has no API key saved — delete it in Settings → AI Providers "
            "and re-add it with your key (the form now requires one)."
        )
    if not base_url:
        raise AIGatewayError("the active provider has no Base URL saved — re-add it in Settings → AI Providers.")

    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=60.0)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
        )
        content = response.choices[0].message.content
        if not content:
            raise AIGatewayError("the provider returned an empty response — try again or use a different model.")
        return content
    except AIGatewayError:
        raise
    except Exception as e:
        raise AIGatewayError(_map_provider_error(e, base_url, model)) from e
