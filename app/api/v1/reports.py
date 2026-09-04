from datetime import datetime, timezone
from html import escape
import json
from decimal import Decimal
from typing import Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import HTMLResponse
from app.persistence.store import stage_store

router = APIRouter(prefix="/audit-runs", tags=["reports"])

DISCLAIMER = (
    "AuditGraph identifies anomalies and prioritizes transactions for professional review. "
    "Findings do not constitute a determination of fraud. "
    "Final conclusions and accounting adjustments require professional auditor judgment and supporting evidence."
)


def _generate_case_remediation(case: dict[str, Any]) -> dict[str, Any]:
    anomaly_types = case.get("anomaly_types", [])
    primary_anomaly = anomaly_types[0] if anomaly_types else "ANOMALY"
    exposure = float(case.get("monetary_exposure", 0.0))
    txns = case.get("transaction_ids", [])
    entities = case.get("entity_ids", [])
    entity_str = ", ".join(entities) if entities else "Counterparty"

    audit_actions = []
    corrective_actions = []

    if any("DUPLICATE" in a for a in anomaly_types):
        audit_actions.append(f"Inspect original purchase orders, delivery challans, and payment vouchers for transactions: {', '.join(txns[:5])}.")
        audit_actions.append(f"Perform external confirmation under SA 505 with {entity_str} regarding invoice settlement status.")
        audit_actions.append("Verify whether electronic bank disbursement was executed more than once.")
        corrective_actions.append("If duplicate disbursement is confirmed, issue formal demand recovery notice to vendor.")
        corrective_actions.append("Ask the auditor to determine any recovery or accounting adjustment after the underlying evidence is confirmed.")
    elif any("ROUND_TRIP" in a or "CYCLE" in a for a in anomaly_types):
        audit_actions.append(f"Obtain and cross-verify underlying commercial contracts, bills of lading, and e-way bills across involved entities: {entity_str}.")
        audit_actions.append("Conduct beneficial ownership and common-directorship search via Ministry of Corporate Affairs (MCA21) registry.")
        audit_actions.append("Evaluate commercial substance of fund circulation under SA 240 (Auditor's Responsibilities Relating to Fraud).")
        corrective_actions.append("Flag circulation loop to Senior Audit Partner and Governance Board for forensic escrow review.")
        corrective_actions.append("Ask the auditor to assess commercial substance and any accounting or tax implications before proposing an adjustment.")
    elif any("BACKDATE" in a for a in anomaly_types):
        audit_actions.append(f"Inspect ERP system audit logs to establish exact server timestamp versus document date for vouchers: {', '.join(txns[:5])}.")
        audit_actions.append("Verify approval hierarchy for manual accounting journals posted outside standard posting windows.")
        corrective_actions.append("Re-evaluate accounting period cut-off under Ind AS 1 / AS 1; reverse prior-period manual accrual if cut-off criteria are violated.")
    elif any("GST" in a for a in anomaly_types):
        audit_actions.append(f"Reconcile purchase register line items against GSTR-2B filing records for vendor {entity_str}.")
        audit_actions.append("Verify active status and tax compliance rating of vendor GSTIN on GST Common Portal.")
        corrective_actions.append("Obtain the relevant tax records and have a qualified auditor determine whether a correction is required; the ledger marker alone is not a tax conclusion.")
    elif any("PERIOD_END" in a for a in anomaly_types):
        audit_actions.append("Substantiate year-end management accruals and expense provisions against post-balance-sheet subsequent payments.")
        audit_actions.append("Inspect supporting timesheets, completion certificates, and authorized quotation schedules.")
        corrective_actions.append("Adjust unverified year-end provisions to prevent pre-closing profit understatement or artificial inflation.")
    else:
        audit_actions.append(f"Perform substantive audit vouching for transaction set: {', '.join(txns[:5])}.")
        audit_actions.append(f"Examine independent authorization documentation and purchase approvals for {entity_str}.")
        corrective_actions.append("Record finding in Auditor's Review Notes for resolution during management representation conference.")

    return {
        "case_id": case.get("case_id"),
        "title": case.get("title"),
        "severity": case.get("severity"),
        "risk_score": case.get("risk_score"),
        "primary_anomaly": primary_anomaly,
        "monetary_exposure": exposure,
        "transaction_ids": txns,
        "entity_ids": entities,
        "recommended_audit_actions": audit_actions,
        "proposed_corrective_actions": corrective_actions,
        "statutory_standards": [],
        "prohibits_auto_mutation": True,
        "audit_note": "AI recommendations are advisory triage procedures. No accounting records are modified automatically.",
    }


@router.get("/{run_id}/cases/{case_id}/remediation")
async def get_case_remediation(run_id: str, case_id: str):
    """Retrieve structured AI-recommended audit procedures and proposed corrective actions for an investigation."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    for case in result.get("cases", []):
        if case.get("case_id") == case_id or case.get("finding_id") == case_id:
            return _generate_case_remediation(case)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "CASE_NOT_FOUND", "message": f"Case '{case_id}' not found in audit run '{run_id}'."},
    )


@router.get("/{run_id}/report")
async def get_audit_report(run_id: str):
    """Generate comprehensive structured audit report payload scoped strictly to the current run."""
    result = stage_store.get_run_result(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RUN_NOT_FOUND", "message": f"Audit run '{run_id}' not found."},
        )

    cases = [{**case, "severity": str(case.get("severity", "")).split(".")[-1].upper()}
             for case in result.get("cases", [])]
    txns_analyzed = result.get("transactions_analyzed", 0)
    dataset_id = result.get("dataset_id", "ds_unknown")
    dataset_ref = stage_store.get_dataset(dataset_id)
    filename = dataset_ref.filename if dataset_ref else "uploaded_ledger"

    # Categorize cases into statutory sections
    duplicate_findings = [c for c in cases if any("DUPLICATE" in a for a in c.get("anomaly_types", []))]
    backdated_findings = [c for c in cases if any("BACKDATE" in a for a in c.get("anomaly_types", []))]
    round_trip_findings = [c for c in cases if any("ROUND_TRIP" in a or "CYCLE" in a for a in c.get("anomaly_types", []))]
    gst_findings = [c for c in cases if any("GST" in a for a in c.get("anomaly_types", []))]
    period_end_findings = [c for c in cases if any("PERIOD_END" in a for a in c.get("anomaly_types", []))]
    ml_findings = [c for c in cases if any("ISOLATION_FOREST" in a or "ML" in a or a == "STATISTICAL_OUTLIER" for a in c.get("anomaly_types", []))]

    other_high_risk = [
        c for c in cases
        if str(c.get("severity", "")).upper() in ("CRITICAL", "HIGH")
        and c not in duplicate_findings
        and c not in backdated_findings
        and c not in round_trip_findings
        and c not in gst_findings
        and c not in period_end_findings
    ]

    total_exposure = result.get("total_exposure", sum(float(c.get("monetary_exposure", 0.0)) for c in cases))

    remediations = [_generate_case_remediation(c) for c in cases[:10]]

    return {
        "report_title": "AUDITGRAPH FINANCIAL AUDIT ANOMALY ANALYSIS REPORT",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "audit_information": {
            "source_filename": filename,
            "dataset_id": dataset_id,
            "run_id": run_id,
            "analysis_date": result.get("created_at") or datetime.now(timezone.utc).date().isoformat(),
            "rows_analyzed": txns_analyzed,
            "status": result.get("status", "READY"),
        },
        "executive_summary": {
            "transactions_analyzed": txns_analyzed,
            "total_investigation_cases": len(cases),
            "critical_cases": sum(1 for c in cases if str(c.get("severity", "")).upper() == "CRITICAL"),
            "high_cases": sum(1 for c in cases if str(c.get("severity", "")).upper() == "HIGH"),
            "medium_cases": sum(1 for c in cases if str(c.get("severity", "")).upper() == "MEDIUM"),
            "low_cases": sum(1 for c in cases if str(c.get("severity", "")).upper() == "LOW"),
            "potential_exposure_inr": total_exposure,
            "review_surface_reduction_pct": result.get("review_surface_reduction_pct", 0.0),
        },
        "ml_model": result.get("ml_model", {"inference": "UNAVAILABLE"}),
        "risk_distribution": {s: sum(str(c.get("severity", "")).upper() == s for c in cases) for s in ("CRITICAL", "HIGH", "MEDIUM", "LOW")},
        "methodology": {
            "deterministic_rules": "10 vectorized rule tests covering duplicate vouchers, split invoices, round amounts, rapid reversals, and cut-off delays.",
            "unsupervised_ml": "Scikit-Learn Isolation Forest multi-feature statistical outlier boundary detection.",
            "graph_forensics": "NetworkX directed multigraph cycle analysis detecting circular money loops up to 4 hops.",
            "gst_reconciliation": "Explicit GST mismatch markers supplied in ledger narration; no independent GSTR-2B reconciliation performed.",
            "materiality_fusion": "Multi-engine risk scoring with a configured materiality threshold; scores prioritize review.",
        },
        "key_findings": cases,
        "duplicate_findings": duplicate_findings,
        "backdated_findings": backdated_findings,
        "round_trip_findings": round_trip_findings,
        "gst_findings": gst_findings,
        "period_end_findings": period_end_findings,
        "ml_findings": ml_findings,
        "other_high_risk_findings": other_high_risk,
        "recommended_audit_procedures": remediations,
        "limitations": [
            "Analysis is bound strictly to provided general ledger columns and values.",
            "Bank verification requires third-party confirmation under SA 505.",
            "Anomaly risk scores are advisory triage priorities and not definitive determinations of illegality.",
        ],
        "disclaimer": DISCLAIMER,
    }


@router.get("/{run_id}/report/printable", response_class=HTMLResponse)
async def get_printable_audit_report(run_id: str):
    """Generate publication-quality printable HTML report suitable for direct PDF export."""
    def escaped(value):
        if isinstance(value, str): return escape(value)
        if isinstance(value, list): return [escaped(v) for v in value]
        if isinstance(value, dict): return {k: escaped(v) for k, v in value.items()}
        return value
    report = escaped(await get_audit_report(run_id))
    info = report["audit_information"]
    summary = report["executive_summary"]
    cases = report["key_findings"]

    cases_html = ""
    for c in cases[:15]:
        txns_str = ", ".join(c.get("transaction_ids", []))
        ev_items = "".join(f"<li>{ev if isinstance(ev, str) else ev.get('label', '') + ': ' + str(ev.get('value', ''))}</li>" for ev in c.get("evidence", [])[:4])
        sev_color = "#DC2626" if str(c.get("severity", "")).upper() == "CRITICAL" else "#EA580C" if str(c.get("severity", "")).upper() == "HIGH" else "#D97706"

        cases_html += f"""
        <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: bold; font-size: 14px; color: #0F172A;">{c.get('case_id')}: {c.get('title')}</span>
                <span style="background: {sev_color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                    {c.get('severity')} (Score: {c.get('risk_score', 0):.1f})
                </span>
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
                <strong>Potential Exposure:</strong> ₹{float(c.get('monetary_exposure', 0)):,.2f} |
                <strong>Vouchers:</strong> {txns_str}
            </div>
            <ul style="font-size: 11px; color: #334155; margin: 0; padding-left: 20px;">
                {ev_items}
            </ul>
        </div>
        """

    sections = [("Audit Methodology", "methodology"), ("ML Model / Version", "ml_model"),
                ("Risk Distribution", "risk_distribution"), ("Duplicate Findings", "duplicate_findings"),
                ("Backdated Findings", "backdated_findings"), ("Round-Trip Findings", "round_trip_findings"),
                ("GST Findings", "gst_findings"), ("Period-End Findings", "period_end_findings"),
                ("ML Statistical Anomalies", "ml_findings"), ("Recommended Audit Procedures and Proposed Remediation", "recommended_audit_procedures"),
                ("Limitations", "limitations")]
    details_html = "".join(f"<h2>{title}</h2><pre style='white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px'>{json.dumps(report[key], indent=2, default=str, ensure_ascii=False)}</pre>" for title, key in sections)
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AuditGraph Report - {info['run_id']}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; color: #0F172A; padding: 36px; max-width: 900px; margin: auto; }}
        h1 {{ font-size: 24px; border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 4px; }}
        .meta-table {{ width: 100%; border-collapse: collapse; margin: 16px 0 24px 0; font-size: 12px; }}
        .meta-table td {{ padding: 6px 10px; border: 1px solid #CBD5E1; }}
        .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }}
        .kpi-card {{ border: 1px solid #CBD5E1; border-radius: 6px; padding: 12px; text-align: center; }}
        .kpi-val {{ font-size: 20px; font-weight: bold; color: #1E293B; }}
        .kpi-label {{ font-size: 11px; color: #64748B; text-transform: uppercase; }}
        .disclaimer {{ background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #F59E0B; padding: 12px; font-size: 11px; color: #475569; margin-top: 32px; }}
        @media print {{ body {{ padding: 0; }} .no-print {{ display: none; }} }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #2563EB; color: white; padding: 8px 16px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
        </button>
    </div>

    <h1>AUDITGRAPH FINANCIAL AUDIT ANOMALY ANALYSIS REPORT</h1>
    <p style="color: #64748B; font-size: 12px; margin-top: 0;">Multi-Engine Forensic Triage for Statutory Ledger Review</p>

    <table class="meta-table">
        <tr>
            <td><strong>Source Ledger File:</strong> {info['source_filename']}</td>
            <td><strong>Audit Run ID:</strong> {info['run_id']}</td>
        </tr>
        <tr>
            <td><strong>Dataset Identifier:</strong> {info['dataset_id']}</td>
            <td><strong>Analysis Date:</strong> {info['analysis_date']}</td>
        </tr>
        <tr>
            <td><strong>Total Ledger Rows:</strong> {info['rows_analyzed']:,}</td>
            <td><strong>Review Surface Reduction:</strong> {summary['review_surface_reduction_pct']:.2f}%</td>
        </tr>
    </table>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-val">{summary['transactions_analyzed']:,}</div>
            <div class="kpi-label">Transactions</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-val">{summary['total_investigation_cases']}</div>
            <div class="kpi-label">Cases Identified</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-val" style="color: #DC2626;">{summary['critical_cases']}</div>
            <div class="kpi-label">Critical Red Flags</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-val">₹{summary['potential_exposure_inr']:,.2f}</div>
            <div class="kpi-label">Potential Exposure</div>
        </div>
    </div>

    <h2 style="font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 24px;">Key Prioritized Findings</h2>
    {cases_html}
    {details_html}

    <div class="disclaimer">
        <strong>Statutory & Regulatory Notice:</strong><br>
        {report['disclaimer']}
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html)
