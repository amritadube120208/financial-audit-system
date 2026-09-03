from app.domain.models import InvestigationCase


def generate_deterministic_explanation(case: InvestigationCase) -> str:
    """
    Generate a deterministic, evidence-grounded natural language explanation for an investigation case.
    Does NOT use an LLM provider and guarantees 100% offline stage availability.
    """
    lines = []
    lines.append(f"This investigation was prioritized with a risk score of {case.risk_score:.1f}/100 ({case.severity.value}) based on computed evidence:")

    # Map evidence items into bullet points
    for ev in case.evidence:
        label = ev.label
        val = ev.value
        unit = f" {ev.unit}" if ev.unit else ""
        lines.append(f"• {label}: {val}{unit}")

    # Specific wording for round trips
    if "ROUND_TRIP" in case.anomaly_types or "GRAPH_CYCLE" in [ev.key for ev in case.evidence]:
        lines.append("The relational graph engine identified a multi-entity circular transaction path completed within a tight timeframe near reporting period close.")
    elif "EXACT_DUPLICATE" in case.anomaly_types:
        lines.append("The deterministic rule engine detected multiple identical transactions with matching counterparty, invoice number, and posting amount.")
    elif "BACKDATED_POSTING" in case.anomaly_types:
        lines.append("The rule engine identified a significant delay between the document date and the posting date near accounting period close.")
    elif "GST_BOOK_MISMATCH" in case.anomaly_types:
        lines.append("Reconciliation revealed a mismatch between purchase register entries and GSTR-2B tax portal records.")

    # Mandated audit safeguard disclaimer
    lines.append("The pattern requires auditor review; it is not classified as fraud by the system.")

    return "\n".join(lines)


def attach_deterministic_explanations(cases: list[InvestigationCase]) -> list[InvestigationCase]:
    """Attach generated deterministic explanations to a list of cases."""
    for case in cases:
        if not case.explanation:
            case.explanation = generate_deterministic_explanation(case)
    return cases
