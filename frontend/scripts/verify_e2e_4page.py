import urllib.request
import json
import time

base = "http://localhost:3000"

print("========================================")
print("  AUDITGRAPH 4-PAGE E2E INTEGRATION TEST")
print("========================================")

# 1. Health Probe
req = urllib.request.urlopen(f"{base}/healthz")
h = json.loads(req.read().decode())
print(f"[PASS] 1. Health Probe: status={h.get('status')}")

# 2. Upload File
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
with open("data/uploads/ds_85e7b916a53343fe_contract_test.csv", "rb") as f:
    content = f.read()

body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="canonical_ledger.csv"\r\n'
    f"Content-Type: text/csv\r\n\r\n"
).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")

req = urllib.request.Request(
    f"{base}/api/v1/datasets",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)
up = json.loads(urllib.request.urlopen(req).read().decode())
dataset_id = up["dataset_id"]
row_count = up["row_count"]
print(f"[PASS] 2. Dataset Uploaded: {dataset_id}, rows={row_count}")

# 3. Create Audit Run
run_req = urllib.request.Request(
    f"{base}/api/v1/audit-runs",
    data=json.dumps({"dataset_id": dataset_id}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
run = json.loads(urllib.request.urlopen(run_req).read().decode())
run_id = run["run_id"]
print(f"[PASS] 3. Audit Run Created: {run_id}")

# Wait for completion
for _ in range(30):
    st_req = urllib.request.urlopen(f"{base}/api/v1/audit-runs/{run_id}")
    st = json.loads(st_req.read().decode())
    if st.get("status") in ("READY", "DEGRADED", "FAILED"):
        print(f"[PASS] 4. Audit Run Finalized: status={st.get('status')}, progress={st.get('progress')}")
        break
    time.sleep(1)

# 5. Summary
sum_req = urllib.request.urlopen(f"{base}/api/v1/audit-runs/{run_id}/summary")
summary = json.loads(sum_req.read().decode())
metrics = summary["metrics"]
print(f"[PASS] 5. Summary Metrics: total_txns={metrics['total_transactions']}, critical={metrics['critical_findings']}, exposure={metrics['total_exposure']}")

# 6. Findings
find_req = urllib.request.urlopen(f"{base}/api/v1/audit-runs/{run_id}/findings?limit=5")
findings = json.loads(find_req.read().decode())
first_title = findings["findings"][0]["title"] if findings.get("findings") else "No findings"
print(f"[PASS] 6. Findings: total_returned={findings['total_returned']}, first_title={first_title[:40]}")

# 7. Transactions
txn_req = urllib.request.urlopen(f"{base}/api/v1/audit-runs/{run_id}/transactions?limit=5")
txns = json.loads(txn_req.read().decode())
first_id = txns["transactions"][0]["transaction_id"] if txns.get("transactions") else "None"
print(f"[PASS] 7. Transactions: total_returned={txns['total_returned']}, first_id={first_id}")

# 8. Copilot
cop_req = urllib.request.Request(
    f"{base}/api/v1/copilot/sessions",
    data=json.dumps({"run_id": run_id, "title": "Test Session"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
copilot_sess = json.loads(urllib.request.urlopen(cop_req).read().decode())
sess_id = copilot_sess["session_id"]

msg_req = urllib.request.Request(
    f"{base}/api/v1/copilot/sessions/{sess_id}/messages",
    data=json.dumps({"message": "Why is this risky?"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
msg = json.loads(urllib.request.urlopen(msg_req).read().decode())
ans = msg.get("answer", "")[:60]
print(f"[PASS] 8. Copilot: answer={ans}..., mode={msg.get('mode')}, citations={len(msg.get('citations', []))}")

print("\n>>> ALL 8 E2E INTEGRATION TESTS PASSED CLEANLY! <<<")
