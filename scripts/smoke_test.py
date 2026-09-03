import argparse
import sys
import time
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def run_smoke_test(base_url: str = "http://127.0.0.1:8085", dataset_path: str = "data/demo/auditgraph_demo_100k.csv"):
    print("==================================================")
    print(" AUDITGRAPH BACKEND STAGE SMOKE TEST")
    print(f" Base URL: {base_url}")
    print(f" Dataset:  {dataset_path}")
    print("==================================================\n")

    client = httpx.Client(base_url=base_url, timeout=30.0)

    # 1. Healthz
    print("[1/10] Checking /healthz...")
    resp = client.get("/healthz")
    assert resp.status_code == 200, f"/healthz failed: {resp.text}"
    print("      [OK] /healthz PASS")

    # 2. Readyz
    print("[2/10] Checking /readyz...")
    resp = client.get("/readyz")
    assert resp.status_code == 200, f"/readyz failed: {resp.text}"
    print(f"      [OK] /readyz PASS ({resp.json().get('status')})")

    # 3. Upload dataset
    print(f"[3/10] Uploading dataset {dataset_path}...")
    with open(dataset_path, "rb") as f:
        resp = client.post("/api/v1/datasets", files={"file": (dataset_path.split("/")[-1], f, "text/csv")})
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    ds_data = resp.json()
    dataset_id = ds_data["dataset_id"]
    sha256 = ds_data["sha256"]
    row_count = ds_data["row_count"]
    print(f"      [OK] Upload PASS (dataset_id={dataset_id}, rows={row_count:,}, sha256={sha256[:12]}...)")

    # 4. Start Audit Run
    print("[4/10] Starting audit run...")
    t0 = time.time()
    resp = client.post("/api/v1/audit-runs", json={"dataset_id": dataset_id})
    assert resp.status_code == 201, f"Audit run creation failed: {resp.text}"
    run_data = resp.json()
    run_id = run_data["run_id"]
    status_str = run_data["status"]
    duration_ms = (time.time() - t0) * 1000.0
    print(f"      [OK] Audit run created PASS (run_id={run_id}, status={status_str}, duration={duration_ms:.1f}ms)")

    # 5. Check Audit Run Summary
    print("[5/10] Retrieving run summary...")
    resp = client.get(f"/api/v1/audit-runs/{run_id}/summary")
    assert resp.status_code == 200, f"Run summary failed: {resp.text}"
    summary_data = resp.json()
    metrics = summary_data.get("summary", {})
    crit_count = metrics.get("critical_findings", 0)
    total_cases = metrics.get("total_cases", 0)
    print(f"      [OK] Summary PASS (cases={total_cases}, critical={crit_count})")

    # 6. Retrieve Findings & Check Hero Case
    print("[6/10] Checking prioritized cases & hero round-trip finding...")
    resp = client.get(f"/api/v1/audit-runs/{run_id}/findings")
    assert resp.status_code == 200, f"Get findings failed: {resp.text}"
    cases_payload = resp.json()
    cases = cases_payload.get("cases", [])
    assert len(cases) > 0, "No cases returned by backend!"

    hero_case = cases[0]
    hero_id = hero_case["case_id"]
    hero_score = hero_case["risk_score"]
    hero_sev = hero_case["severity"]
    print(f"      [OK] Top Investigation: {hero_id} | Score: {hero_score:.1f} | Severity: {hero_sev}")

    # 7. Check Graph API Payload
    print("[7/10] Checking graph API payload...")
    resp = client.get(f"/api/v1/findings/{hero_id}/graph")
    assert resp.status_code == 200, f"Get graph payload failed: {resp.text}"
    graph_payload = resp.json()
    nodes = graph_payload.get("graph", {}).get("nodes", [])
    edges = graph_payload.get("graph", {}).get("edges", [])
    print(f"      [OK] Graph Payload PASS (nodes={len(nodes)}, edges={len(edges)})")

    # 8. Create Copilot Session & Ask Question
    print("[8/10] Testing AI Audit Copilot session & grounded chat...")
    resp = client.post("/api/v1/copilot/sessions", json={"run_id": run_id})
    assert resp.status_code == 201, f"Copilot session creation failed: {resp.text}"
    session_id = resp.json()["session_id"]

    resp = client.post(
        f"/api/v1/copilot/sessions/{session_id}/messages",
        json={"message": f"Why is {hero_id} critical?", "selected_case_id": hero_id},
    )
    assert resp.status_code == 200, f"Copilot message failed: {resp.text}"
    chat_resp = resp.json()
    print(f"      [OK] Copilot Response PASS (mode={chat_resp.get('mode')}, citations={len(chat_resp.get('citations', []))})")

    # 9. Verify Report Export
    print("[9/10] Verifying audit report export API...")
    resp = client.get(f"/api/v1/exports/{run_id}")
    assert resp.status_code == 200, f"Export API failed: {resp.text}"
    print("      [OK] Report Export PASS")

    # 10. Summary
    print("\n==================================================")
    print(" ALL 10 SMOKE TEST STAGES PASSED SUCCESSFULLY!")
    print("==================================================")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8085")
    parser.add_argument("--dataset", default="data/demo/auditgraph_demo_100k.csv")
    args = parser.parse_args()

    try:
        run_smoke_test(base_url=args.base_url, dataset_path=args.dataset)
        sys.exit(0)
    except Exception as exc:
        print(f"\n[FAIL] SMOKE TEST FAILED: {str(exc)}")
        sys.exit(1)
