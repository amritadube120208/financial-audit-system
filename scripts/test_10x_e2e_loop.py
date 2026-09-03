"""
AuditGraph 10x Automated End-to-End Verification Loop
Executes 10 consecutive full-lifecycle audit pipeline passes:
Upload -> Normalize -> Rules + ML + Graph + GST -> Risk Fusion -> Investigations -> Copilot -> Remediation -> Report -> Reset
"""

from unittest.mock import patch
import httpx
from sklearn.ensemble import IsolationForest

BASE = "http://127.0.0.1:8000"


def run_single_pass(pass_idx: int) -> bool:
    with httpx.Client(timeout=30.0) as client:
        # 1. Verify health & ML status
        r_health = client.get(f"{BASE}/healthz")
        assert r_health.status_code == 200, f"Health failed: {r_health.text}"
        h_data = r_health.json()
        assert h_data.get("ml", {}).get("inference") == "READY", "ML Inference must be READY"

        # 2. Upload AuditGraph_Demo_SME_Ledger.xlsx
        with open("AuditGraph_Demo_SME_Ledger.xlsx", "rb") as f:
            files = {"file": ("AuditGraph_Demo_SME_Ledger.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            r_up = client.post(f"{BASE}/api/v1/datasets", files=files)
        assert r_up.status_code in (200, 201), f"Upload failed: {r_up.text}"
        ds = r_up.json()
        dataset_id = ds["dataset_id"]
        assert ds["row_count"] == 57, f"Expected 57 rows, got {ds['row_count']}"

        # 3. Create unique audit run
        r_run = client.post(f"{BASE}/api/v1/audit-runs", json={"dataset_id": dataset_id})
        assert r_run.status_code in (200, 201), f"Create run failed: {r_run.text}"
        run_data = r_run.json()
        run_id = run_data["run_id"]
        assert run_data["status"] == "READY", f"Run not ready: {run_data['status']}"

        # 4. Verify summary metrics
        r_sum = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/summary")
        assert r_sum.status_code == 200
        summary = r_sum.json()["summary"]
        assert summary["transactions_analyzed"] == 57
        assert summary["total_cases"] >= 10
        assert summary["total_exposure"] > 0

        # 5. Verify prioritized findings & dynamic case titles
        r_find = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/findings")
        assert r_find.status_code == 200
        cases = r_find.json().get("findings") or r_find.json().get("cases") or []
        assert len(cases) >= 10

        cycle_case = next((c for c in cases if "Circular" in c["title"] or "ROUND_TRIP" in str(c.get("anomaly_types"))), None)
        assert cycle_case is not None, "Expected circular money flow case"

        dup_case = next((c for c in cases if "Duplicate" in c["title"]), None)
        assert dup_case is not None, "Expected duplicate payment case"

        # 6. Verify money flow graph: Cycle case has nodes, non-cycle case has empty graph
        r_g_cycle = client.get(f"{BASE}/api/v1/findings/{cycle_case['finding_id']}/graph")
        assert r_g_cycle.status_code == 200
        g_cycle = r_g_cycle.json()
        assert len(g_cycle.get("nodes", [])) >= 3, "Expected at least 3 nodes in cycle graph"

        r_g_dup = client.get(f"{BASE}/api/v1/findings/{dup_case['finding_id']}/graph")
        assert r_g_dup.status_code == 200
        g_dup = r_g_dup.json()
        assert len(g_dup.get("nodes", [])) == 0, "Non-cycle case must have 0 graph nodes"
        assert "No circular money-flow evidence" in g_dup.get("cycle_info", {}).get("message", "")

        # 7. Verify AI Recommended Remediation (Non-destructive)
        r_rem = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/cases/{cycle_case['finding_id']}/remediation")
        assert r_rem.status_code == 200
        rem = r_rem.json()
        assert len(rem.get("recommended_audit_actions", [])) >= 2
        assert len(rem.get("proposed_corrective_actions", [])) >= 1
        assert rem.get("prohibits_auto_mutation") is True

        # 8. Verify AI Audit Report
        r_rep = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/report")
        assert r_rep.status_code == 200
        rep = r_rep.json()
        assert rep["audit_information"]["run_id"] == run_id
        assert rep["executive_summary"]["transactions_analyzed"] == 57
        assert "disclaimer" in rep
        assert "Findings do not constitute a determination of fraud" in rep["disclaimer"]

        # 9. Verify Copilot chat grounded in current run
        r_sess = client.post(f"{BASE}/api/v1/copilot/sessions", json={"run_id": run_id, "title": f"Pass {pass_idx}"})
        assert r_sess.status_code in (200, 201)
        sess_id = r_sess.json()["session_id"]

        r_msg = client.post(
            f"{BASE}/api/v1/copilot/sessions/{sess_id}/messages",
            json={"message": "What is the monetary exposure of the top red flag?"}
        )
        assert r_msg.status_code == 200
        msg_data = r_msg.json()
        assert msg_data.get("grounded") is True
        assert len(msg_data.get("answer", "")) > 10

        return True


def main():
    print("================================================================")
    print("STARTING AUDITGRAPH 10-PASS AUTOMATED E2E VERIFICATION LOOP")
    print("================================================================")

    passed_count = 0
    total_passes = 10

    for i in range(1, total_passes + 1):
        try:
            success = run_single_pass(i)
            if success:
                passed_count += 1
                print(f"PASS {i}: OK (All 9 Lifecycle Checks Passed)")
            else:
                print(f"FAIL {i}")
        except Exception as exc:
            print(f"FAIL {i}: {exc}")

    print("================================================================")
    print(f"10x E2E RESULT: {passed_count}/{total_passes} PASSES SUCCESSFUL")
    print("================================================================")
    assert passed_count == total_passes, f"Expected {total_passes} passes, got {passed_count}"


if __name__ == "__main__":
    main()
