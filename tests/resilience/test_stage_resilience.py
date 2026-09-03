import pytest
from datetime import date
from decimal import Decimal
from app.config import settings
from app.domain.models import CanonicalTransaction
from app.orchestration.pipeline import pipeline_orchestrator


@pytest.mark.asyncio
async def test_graph_failure_resilience(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_FAIL_GRAPH", 1)

    t1 = CanonicalTransaction(
        transaction_id="TX-1",
        posting_date=date(2026, 3, 29),
        amount=Decimal("495000.00"),
        entity_id="VENDOR_X",
    )

    result = await pipeline_orchestrator.run_pipeline(
        run_id="run_resilience_test",
        dataset_sha256="test_sha256_fake",
        transactions=[t1],
    )

    assert result["status"] == "DEGRADED"
    assert result["analysis_mode"] == "degraded"
    assert any("DEMO_FAIL_GRAPH" in r for r in result["degraded_reasons"])
