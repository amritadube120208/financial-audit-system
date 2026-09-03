import pytest
import sys
from pathlib import Path
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.main import app


@pytest.mark.asyncio
async def test_healthz_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_readyz_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/readyz")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_dataset_upload_and_run_flow():
    csv_content = (
        "transaction_id,posting_date,amount,vendor_name,invoice_number,narration\n"
        "TXN-001,2026-03-29,495000.00,VENDOR_X17,INV-1001,Year-end advance transfer\n"
        "TXN-002,2026-03-30,490000.00,VENDOR_Y09,INV-1002,Subcontractor clearing\n"
        "TXN-003,2026-03-30,487500.00,COMPANY_MAIN,INV-1003,Refund of unutilized advance\n"
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Upload Dataset
        upload_resp = await client.post(
            "/api/v1/datasets",
            files={"file": ("test_ledger.csv", csv_content.encode("utf-8"), "text/csv")},
        )
        assert upload_resp.status_code == 200
        ds_data = upload_resp.json()
        dataset_id = ds_data["dataset_id"]
        assert ds_data["row_count"] == 3

        # 2. Create Audit Run
        run_resp = await client.post("/api/v1/audit-runs", json={"dataset_id": dataset_id})
        assert run_resp.status_code == 201
        run_data = run_resp.json()
        run_id = run_data["run_id"]
        assert run_data["status"] in ("READY", "DEGRADED")

        # 3. Retrieve Findings
        findings_resp = await client.get(f"/api/v1/audit-runs/{run_id}/findings")
        assert findings_resp.status_code == 200
        cases_data = findings_resp.json()
        assert cases_data["total_cases"] >= 1

        # 4. Create Copilot Session & Message
        session_resp = await client.post("/api/v1/copilot/sessions", json={"run_id": run_id})
        assert session_resp.status_code == 201
        session_id = session_resp.json()["session_id"]

        msg_resp = await client.post(
            f"/api/v1/copilot/sessions/{session_id}/messages",
            json={"message": "Why is the top finding critical?"},
        )
        assert msg_resp.status_code == 200
        assert msg_resp.json()["grounded"] is True
