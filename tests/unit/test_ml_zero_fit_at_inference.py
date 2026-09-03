"""
Test that during normal user audit execution:
The ML IsolationForest model performs inference only and .fit() calls = 0.
"""

from unittest.mock import patch
import pytest
from sklearn.ensemble import IsolationForest
from app.ingest.loader import load_dataset
from app.orchestration.pipeline import pipeline_orchestrator
from app.ml.registry import model_registry


@pytest.mark.asyncio
async def test_zero_fit_during_user_audit():
    # Ensure pre-trained model is loaded in registry
    assert model_registry.load_default_model() is True
    assert model_registry.is_ready() is True

    # Ingest test dataset
    with open("AuditGraph_Demo_SME_Ledger.xlsx", "rb") as f:
        content = f.read()

    ds, txns = load_dataset(content, "AuditGraph_Demo_SME_Ledger.xlsx", "ds_zero_fit_test")
    assert len(txns) > 0

    fit_calls = 0

    original_fit = IsolationForest.fit

    def spied_fit(self, *args, **kwargs):
        nonlocal fit_calls
        fit_calls += 1
        return original_fit(self, *args, **kwargs)

    with patch.object(IsolationForest, "fit", side_effect=spied_fit):
        result = await pipeline_orchestrator.run_pipeline(
            run_id="run_zero_fit_test",
            dataset_sha256=ds.sha256,
            transactions=txns,
        )

    # Assert exactly 0 fit calls occurred during user audit
    assert fit_calls == 0, f"Expected 0 .fit() calls during user audit, but got {fit_calls}!"
    assert result["status"] == "READY"
    assert len(result.get("cases", [])) > 0
    print(f"SUCCESS: Pipeline completed with {len(result['cases'])} cases and EXACTLY {fit_calls} .fit() calls.")
