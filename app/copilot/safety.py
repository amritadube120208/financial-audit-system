import re

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+all\s+previous\s+instructions",
    r"system\s+prompt",
    r"override\s+rules",
    r"mark\s+as\s+fraud",
    r"delete\s+finding",
    r"drop\s+database",
    r"sql\s+injection",
]


def sanitize_user_input(text: str) -> str:
    """
    Sanitizes user input to prevent prompt injection and untrusted delimiter escaping.
    """
    if not text:
        return ""

    sanitized = str(text).strip()

    # Redact prompt injection patterns
    for pattern in PROMPT_INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[REDACTED_PROMPT_INJECTION]", sanitized, flags=re.IGNORECASE)

    # Escape XML/HTML delimiters
    sanitized = sanitized.replace("<", "&lt;").replace(">", "&gt;")

    return sanitized
