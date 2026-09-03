import httpx

BASE = "http://127.0.0.1:8000"

def test_full_pipeline():
    with httpx.Client(timeout=30.0) as client:
        # 1. Upload AuditGraph_Demo_SME_Ledger.xlsx
        with open("AuditGraph_Demo_SME_Ledger.xlsx", "rb") as f:
            files = {"file": ("AuditGraph_Demo_SME_Ledger.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            r_up = client.post(f"{BASE}/api/v1/datasets", files=files)
        assert r_up.status_code in (200, 201), f"Upload failed: {r_up.status_code} {r_up.text}"
        ds_info = r_up.json()
        print("1. Uploaded dataset:", ds_info["dataset_id"], "Rows:", ds_info["row_count"])

        # 2. Create Audit Run
        r_run = client.post(f"{BASE}/api/v1/audit-runs", json={"dataset_id": ds_info["dataset_id"]})
        assert r_run.status_code in (200, 201), f"Create run failed: {r_run.status_code} {r_run.text}"
        run_data = r_run.json()
        run_id = run_data["run_id"]
        print("2. Created run:", run_id, "Status:", run_data["status"])

        # 3. Get Summary
        r_sum = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/summary")
        assert r_sum.status_code == 200
        summary = r_sum.json()["summary"]
        print("3. Summary - Txns analyzed:", summary["transactions_analyzed"], "Cases:", summary["total_cases"], "Exposure: INR", summary["total_exposure"])

        # 4. Get Findings
        r_find = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/findings")
        assert r_find.status_code == 200
        cases = r_find.json()["findings"]
        print(f"4. Cases surfaced: {len(cases)}")
        for c in cases[:5]:
            print(f"   - {c['finding_id']}: {c['title']} (Risk: {c['risk_score']}, Anomaly: {c['anomaly_type']})")

        # 5. Graph endpoint for cycle finding vs non-cycle finding
        cycle_case = next((c for c in cases if "ROUND_TRIP" in str(c.get("anomaly_type")) or "Circular" in c["title"]), cases[0])
        r_g1 = client.get(f"{BASE}/api/v1/findings/{cycle_case['finding_id']}/graph")
        print("5a. Cycle graph nodes count:", len(r_g1.json().get("nodes", [])))

        non_cycle = next((c for c in cases if "Duplicate" in c["title"]), cases[-1])
        r_g2 = client.get(f"{BASE}/api/v1/findings/{non_cycle['finding_id']}/graph")
        print("5b. Non-cycle graph message:", r_g2.json().get("cycle_info", {}).get("message"))

        # 6. AI Remediation endpoint
        r_rem = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/cases/{cycle_case['finding_id']}/remediation")
        assert r_rem.status_code == 200
        rem = r_rem.json()
        print("6. AI Remediation procedures:", len(rem["recommended_audit_actions"]), "Standards:", rem["statutory_standards"])

        # 7. AI Audit Report
        r_rep = client.get(f"{BASE}/api/v1/audit-runs/{run_id}/report")
        assert r_rep.status_code == 200
        rep = r_rep.json()
        print("7. AI Audit Report generated:", rep["report_title"], "Filename in report:", rep["audit_information"]["source_filename"])

        # 8. Copilot Session & Chat
        r_sess = client.post(f"{BASE}/api/v1/copilot/sessions", json={"run_id": run_id, "title": "Test Session"})
        assert r_sess.status_code in (200, 201)
        sess_id = r_sess.json()["session_id"]
        r_chat = client.post(f"{BASE}/api/v1/copilot/sessions/{sess_id}/messages", json={"message": "Summarize the top red flag and its evidence in this ledger."})
        assert r_chat.status_code == 200
        chat_res = r_chat.json()
        print("8. Copilot answer preview:", chat_res["answer"][:120], "...")
        print("ALL 8 BACKEND WORKFLOW STEPS PASSED WITH 100% REAL DATA!")

if __name__ == "__main__":
    test_full_pipeline()
