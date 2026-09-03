import pytest
from app.copilot.tools.registry import copilot_tools
from app.persistence.store import stage_store


def test_recommended_audit_procedures():
    """Verify get_recommended_audit_procedures maps anomaly types to standard CA audit steps."""
    stage_store.save_run_result(
        "run_test_proc",
        {
            "status": "READY",
            "cases": [
                {
                    "case_id": "case_proc_01",
                    "risk_score": 100.0,
                    "severity": "CRITICAL",
                    "anomaly_types": ["CIRCULAR_FLOW", "GST_MISMATCH", "PERIOD_END_POSTING"],
                }
            ],
        },
    )

    res = copilot_tools.get_recommended_audit_procedures("run_test_proc", "case_proc_01")
    assert res["case_id"] == "case_proc_01"
    procs = res["recommended_procedures"]
    assert len(procs) >= 3

    anomaly_keys = {p["anomaly"] for p in procs}
    assert "CIRCULAR_FLOW" in anomaly_keys
    assert "GST_MISMATCH" in anomaly_keys
    assert "PERIOD_END_POSTING" in anomaly_keys
