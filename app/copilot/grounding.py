from typing import Any
from app.copilot.schemas import CopilotCitation


def validate_grounding_citations(
    answer: str,
    tool_results: list[dict[str, Any]],
    available_cases: list[Any],
) -> tuple[bool, list[CopilotCitation]]:
    """
    Validate that facts and IDs mentioned in answer correspond to tool output evidence.
    Returns:
        is_grounded: bool
        citations: list[CopilotCitation]
    """
    citations: list[CopilotCitation] = []
    seen_ids = set()

    for c in available_cases:
        case_id = getattr(c, "case_id", "")
        title = getattr(c, "title", "Investigation Case")
        if case_id and case_id.lower() in answer.lower() and case_id not in seen_seen_ids(seen_ids):
            seen_ids.add(case_id)
            citations.append(CopilotCitation(type="case", id=case_id, label=title))

        for t_id in getattr(c, "transaction_ids", []):
            if t_id and t_id.lower() in answer.lower() and t_id not in seen_ids:
                seen_ids.add(t_id)
                citations.append(CopilotCitation(type="transaction", id=t_id, label=f"Transaction {t_id}"))

    # If answer claims run-specific facts but tool_results was empty, it is UNGROUNDED
    has_tool_data = any(res.get("data") for res in tool_results)
    is_grounded = has_tool_data or bool(citations)

    return is_grounded, citations


def seen_seen_ids(s: set) -> set:
    return s
