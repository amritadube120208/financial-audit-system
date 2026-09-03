import pytest
from app.copilot.tools.registry import copilot_tools
from app.persistence.store import stage_store


def test_what_if_risk_simulation_ephemeral():
    """Verify What-If simulation calculates risk delta without mutating stored case state."""
    # Populate stage store with sample run
    stage_store.save_run_result(
        "run_test_sim",
        {
            "status": "READY",
            "cases": [
                {
                    "case_id": "case_sim_01",
                    "risk_score": 100.0,
                    "severity": "CRITICAL",
                    "detector_scores": {"rules": 0.90, "ml": 0.85, "graph": 0.98, "materiality": 0.99},
                    "anomaly_types": ["CIRCULAR_FLOW", "PERIOD_END_POSTING"],
                }
            ],
        },
    )

    res = copilot_tools.simulate_risk_without_detector(
        run_id="run_test_sim",
        case_id="case_sim_01",
        excluded_detector="GRAPH",
    )

    assert res["case_id"] == "case_sim_01"
    assert res["excluded_detector"] == "GRAPH"
    assert res["original_score"] == 100.0
    assert res["simulated_score"] < 100.0
    assert res["delta_score"] > 0.0

    # Verify stored case in stage store remains completely unchanged
    stored_case = copilot_tools.get_finding("run_test_sim", "case_sim_01")
    assert stored_case["risk_score"] == 100.0
