import subprocess
import time
import sys
import httpx
import sqlite3

def run_10_clean_restarts():
    print("==================================================")
    print(" 10 CLEAN RESTART RESILIENCE TEST")
    print("==================================================\n")

    port = 8005
    results = []

    for i in range(1, 11):
        print(f"--- Iteration {i:02d}/10 ---")
        # 1. Start fresh FastAPI backend process
        proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(port),
                "--log-level",
                "warning",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        try:
            # 2. Poll until healthy
            client = httpx.Client(base_url=f"http://127.0.0.1:{port}", timeout=20.0)
            is_ready = False
            for _ in range(30):
                try:
                    r = client.get("/healthz")
                    if r.status_code == 200:
                        is_ready = True
                        break
                except Exception:
                    time.sleep(0.3)

            assert is_ready, f"Backend failed to become ready on iteration {i}"

            # 3. Create Session
            r_sess = client.post("/api/v1/copilot/sessions", json={"run_id": "run-demo-sme-2026"})
            assert r_sess.status_code == 201, f"Create session failed: {r_sess.text}"
            sess_id = r_sess.json()["session_id"]

            # 4. Ask Question
            r_msg = client.post(
                f"/api/v1/copilot/sessions/{sess_id}/messages",
                json={"message": "Why is this critical?"},
            )
            assert r_msg.status_code == 200, f"Post message failed: {r_msg.text}"
            data = r_msg.json()
            mode = data.get("mode")
            ans_len = len(data.get("answer", ""))

            # 5. Verify SQLite persistence
            con = sqlite3.connect("auditgraph.db")
            cur = con.cursor()
            db_row = cur.execute("SELECT id FROM copilot_sessions WHERE id = ?;", (sess_id,)).fetchone()
            assert db_row is not None, f"Session {sess_id} not found in DB!"

            print(f"    [OK] Iteration {i:02d}: Sess={sess_id}, Mode={mode}, AnsLen={ans_len}, DB=Persisted")
            results.append("PASS")

        finally:
            proc.terminate()
            proc.wait(timeout=5)
            time.sleep(0.5)

    passed_count = results.count("PASS")
    print("\n==================================================")
    print(f" 10 CLEAN RESTARTS RESULT: {passed_count}/10 PASSED")
    print("==================================================")
    assert passed_count == 10

if __name__ == "__main__":
    run_10_clean_restarts()
