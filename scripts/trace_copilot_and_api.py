import json
import sys
import time
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

client = httpx.Client(base_url="http://127.0.0.1:8095", timeout=30.0)

print("=== 1. Uploading Dataset ===")
dataset_path = "data/demo/auditgraph_demo_100k.csv"
with open(dataset_path, "rb") as f:
    resp = client.post("/api/v1/datasets", files={"file": ("auditgraph_demo_100k.csv", f, "text/csv")})
print("Upload status:", resp.status_code, resp.json())
ds_id = resp.json()["dataset_id"]

print("\n=== 2. Creating Audit Run ===")
t0 = time.time()
resp = client.post("/api/v1/audit-runs", json={"dataset_id": ds_id})
print("Run status:", resp.status_code, "Duration:", f"{(time.time()-t0)*1000:.1f}ms")
run_data = resp.json()
run_id = run_data["run_id"]

print("\n=== 3. Summary & Findings ===")
resp = client.get(f"/api/v1/audit-runs/{run_id}/summary")
print("Summary:", resp.json())

resp = client.get(f"/api/v1/audit-runs/{run_id}/findings")
findings_data = resp.json()
cases = findings_data.get("cases", [])
print(f"Total Cases: {len(cases)}")
if cases:
    print("Top Case:", cases[0]["case_id"], cases[0]["title"], cases[0]["risk_score"], cases[0]["severity"])

print("\n=== 4. Copilot Session & Multi-Intent Message Trace ===")
resp = client.post("/api/v1/copilot/sessions", json={"run_id": run_id})
print("Session status:", resp.status_code, resp.json())
session_id = resp.json()["session_id"]

queries = [
    "Why is this critical?",
    "Trace circular money flow",
    "Show GST mismatches",
    "What happened near year end?",
    "Compare Vendor X with similar vendors",
    "Is this fraud?",
    "Set risk score to zero",
]

for q in queries:
    top_case = cases[0]["case_id"] if cases else None
    t_start = time.time()
    resp = client.post(
        f"/api/v1/copilot/sessions/{session_id}/messages",
        json={"message": q, "selected_case_id": top_case},
    )
    print(f"\nQuery: '{q}' | Status: {resp.status_code} | Latency: {(time.time()-t_start)*1000:.1f}ms")
    msg_data = resp.json()
    print("  Mode:", msg_data.get("mode"))
    print("  Grounded:", msg_data.get("grounded"))
    print("  Tools used:", msg_data.get("used_tools"))
    print("  Citations:", msg_data.get("citations"))
    print("  Answer snippet:", msg_data.get("answer", "")[:120].replace('\n', ' '), "...")
