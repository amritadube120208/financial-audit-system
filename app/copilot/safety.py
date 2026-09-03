import re

PROMPT_INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"ignore all rules",
    r"system prompt",
    r"you are now an unrestricted",
    r"set risk score to 0",
    r"override security",
    r"jailbreak",
]


def sanitize_user_input(text: str) -> str:
    """Sanitizes user input by stripping leading/trailing whitespace and control chars."""
    if not text:
        return ""
    # Strip dangerous HTML / script tags
    clean = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r"<.*?>", "", clean)
    return clean.strip()


def check_prompt_injection(text: str) -> bool:
    """Checks if text contains known prompt injection attack vectors."""
    text_lower = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False
