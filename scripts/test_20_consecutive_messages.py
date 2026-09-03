import asyncio
import httpx
import time
import sqlite3

async def test_20_consecutive():
    print("==================================================")
    print(" 20 CONSECUTIVE COPILOT MESSAGE STRESS TEST")
    print("==================================================\n")

    base_url = "http://127.0.0.1:8000"
    client = httpx.AsyncClient(base_url=base_url, timeout=30.0)

    # 1. Create Session
    r_sess = await client.post("/api/v1/copilot/sessions", json={"run_id": "run-demo-sme-2026"})
    assert r_sess.status_code == 201
    sess_id = r_sess.json()["session_id"]
    print(f"[OK] Created Session: {sess_id}")

    questions = [
        "Why is this critical?",
        "Explain the detector scores",
        "Trace the circular money flow path",
        "What is the monetary exposure for this finding?",
        "Show GST mismatches",
        "What if graph omitted?",
        "What if ML detector omitted?",
        "What if rules detector omitted?",
        "Recommended audit procedures",
        "Who are the counterparties involved?",
        "Summarize the general ledger run",
        "Is this priority critical or high?",
        "Check bank confirmation steps",
        "Explain the GSTR-2B discrepancy",
        "What is the review surface reduction percentage?",
        "Trace voucher flow from Company Main",
        "Why is round trip variance important?",
        "What is the IsolationForest anomaly signal?",
        "Summarize next steps for statutory audit",
        "Provide executive conclusion"
    ]

    successes = 0
    t_start = time.time()

    for idx, q in enumerate(questions, 1):
        t0 = time.time()
        resp = await client.post(
            f"/api/v1/copilot/sessions/{sess_id}/messages",
            json={"message": q}
        )
        latency = round((time.time() - t0) * 1000.0, 1)

        if resp.status_code == 200:
            data = resp.json()
            mode = data.get("mode")
            answer = data.get("answer", "")
            successes += 1
            print(f"[{idx:02d}/20] ({latency}ms) Mode: {mode} | Ans: {len(answer)} chars | Q: {q[:30]}...")
        else:
            print(f"[{idx:02d}/20] FAILED: {resp.status_code} {resp.text}")

        # Small pacing between calls
        await asyncio.sleep(0.3)

    total_time = round(time.time() - t_start, 1)

    # Verify session message count in SQLite
    con = sqlite3.connect("auditgraph.db")
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM copilot_messages WHERE session_id = ?;", (sess_id,))
    total_db_msgs = cur.fetchone()[0]

    print("\n==================================================")
    print(f" 20 CONSECUTIVE TEST RESULTS: {successes}/20 PASSED")
    print(f" Total Messages Persisted in DB: {total_db_msgs} (Expected: 40 [20 User + 20 Assistant])")
    print(f" Total Execution Time: {total_time}s")
    print("==================================================")

    await client.aclose()
    assert successes == 20
    assert total_db_msgs == 40

if __name__ == "__main__":
    asyncio.run(test_20_consecutive())
