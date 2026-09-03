from typing import Any
from app.copilot.schemas import CopilotCitation


def validate_grounding(
    answer: str,
    tool_results: list[dict[str, Any]],
    citations: list[CopilotCitation],
) -> tuple[bool, list[str]]:
    """
    Validates that claims and citations in the Copilot response are grounded in tool results.
    Returns (is_grounded, notes).
    """
    if not answer:
        return False, ["Empty answer"]

    notes = []

    # Check that forbidden ungrounded statements (e.g. declaring fraud) do not exist
    answer_lower = answer.lower()
    if "fraud confirmed" in answer_lower or "fraudulent transaction" in answer_lower:
        notes.append("Answer contains unauthorized fraud classification claim")
        return False, notes

    # Verify that cited IDs exist in tool results
    tool_data_str = str(tool_results)
    for cit in citations:
        if cit.source_id and cit.source_id not in tool_data_str:
            notes.append(f"Citation ID {cit.source_id} not found in tool results")

    is_grounded = len(notes) == 0
    return is_grounded, notes
