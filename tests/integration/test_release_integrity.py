import io
from pathlib import Path
from unittest.mock import patch
import pandas as pd
import pytest
from httpx import AsyncClient, ASGITransport
from sklearn.ensemble import IsolationForest
from app.main import app
from app.ml.registry import model_registry
from app.ingest.loader import load_dataset
from app.detectors.rules.rules_suite import RulesDetector
from app.detectors.graph.graph_cycles import GraphCycleDetector


def test_missing_dates_remain_missing_and_do_not_break_engines():
    content = b'transaction_id,posting_date,document_date,amount,counterparty_name,invoice_number\nA,,bad,80000,Acme,I1\nB,bad,,80000,Acme,I1\n'
    ref, rows = load_dataset(content, 'dates.csv', 'ds_dates')
    assert all(t.posting_date is None and t.document_date is None and t.fiscal_year is None for t in rows)
    assert len(ref.warnings) >= 2
    RulesDetector().run(rows, 'dates')
    assert GraphCycleDetector().run(rows, 'dates') == []


def test_gst_sample_ids_and_tax_ratios_are_not_evidence():
    content = b'transaction_id,posting_date,amount,counterparty_name,invoice_number,gst_amount,gstin,narration\nGST-001,2026-02-04,100000,Acme,INV-GST-001,5000,27ABC,Purchase\nG2,2026-02-05,100000,Acme,I2,5000,27ABC,GST_MISMATCH reported in source\n'
    _, rows = load_dataset(content, 'gst.csv', 'ds_gst')
    findings = [f for f in RulesDetector().run(rows, 'gst') if 'GST' in f.anomaly_type]
    assert len(findings) == 1
    assert findings[0].transaction_ids == ['G2']


def test_reversal_requires_opposite_direction_in_the_same_account_context():
    content = b'transaction_id,posting_date,amount,counterparty_name,debit_account,credit_account\nP1,2026-02-01,73100,One Supplier,Expense,Bank\nP2,2026-02-01,73100,One Supplier,Expense,Bank\nR1,2026-02-02,-73100,One Supplier,Expense,Bank\nOTHER,2026-02-02,-73100,Other Supplier,Other Expense,Other Bank\n'
    _, rows = load_dataset(content, 'reversals.csv', 'ds_reversal_contract')
    reversals = RulesDetector()._detect_rapid_reversals(rows, 'reversal-contract')
    pairs = {frozenset(f.transaction_ids) for f in reversals}
    assert frozenset(['P1', 'P2']) not in pairs
    assert frozenset(['P1', 'R1']) in pairs
    assert not any('OTHER' in pair for pair in pairs)


@pytest.mark.asyncio
async def test_exact_run_isolation_exports_and_html_escaping():
    assert model_registry.load_default_model()
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        results = []
        for vendor, amount in [('<script>alert(1)</script>', 60000), ('Only Dataset B', 91000)]:
            content = f'transaction_id,posting_date,amount,counterparty_name,invoice_number\nSAME-1,2026-02-03,{amount},{vendor},I1\nSAME-2,2026-02-03,{amount},{vendor},I1\n'
            up = await c.post('/api/v1/datasets', files={'file': ('ledger.csv', content.encode(), 'text/csv')})
            assert up.status_code == 201
            run = await c.post('/api/v1/audit-runs', json={'dataset_id': up.json()['dataset_id']})
            assert run.status_code == 201
            run_id = run.json()['run_id']
            tx = await c.get(f'/api/v1/audit-runs/{run_id}/transactions')
            assert tx.status_code == 200
            assert {t['counterparty_name'] for t in tx.json()['transactions']} == {vendor}
            assert all(t['is_suspicious'] and t['flags'] for t in tx.json()['items'])
            page_one = (await c.get(f'/api/v1/audit-runs/{run_id}/transactions?limit=1')).json()
            page_two = (await c.get(f'/api/v1/audit-runs/{run_id}/transactions?limit=1&offset=1')).json()
            assert page_one['items'][0]['transaction_id'] != page_two['items'][0]['transaction_id']
            filtered = (await c.get(f'/api/v1/audit-runs/{run_id}/transactions', params={'suspicious_only': True, 'vendor': vendor})).json()
            assert filtered['total'] == 2
            assert (await c.get(f'/api/v1/audit-runs/{run_id}/transactions?vendor=missing-vendor')).json()['total'] == 0
            summary = (await c.get(f'/api/v1/audit-runs/{run_id}/summary')).json()['metrics']
            assert summary['total_value_inr'] == amount * 2
            findings = (await c.get(f'/api/v1/audit-runs/{run_id}/findings')).json()['findings']
            assert findings
            assert (await c.get(f'/api/v1/audit-runs/{run_id}/findings?search=SAME-2')).json()['total'] > 0
            assert (await c.get(f'/api/v1/audit-runs/{run_id}/findings?detector=RULES')).json()['total'] > 0
            results.append((run_id, findings[0]['finding_id']))
            assert (await c.get(f'/api/v1/audit-runs/{run_id}/export?format=csv')).status_code == 200
            html = (await c.get(f'/api/v1/audit-runs/{run_id}/report/printable')).text
            assert '<script>alert(1)</script>' not in html
        assert results[0][0] != results[1][0] and results[0][1] != results[1][1]
        assert (await c.get(f'/api/v1/audit-runs/{results[1][0]}/cases/{results[0][1]}/remediation')).status_code == 404
        assert (await c.get('/api/v1/audit-runs/unknown/summary')).status_code == 404
        assert (await c.get('/api/v1/findings/unknown')).status_code == 404


@pytest.mark.asyncio
async def test_unseen_xlsx_inference_never_fits():
    assert model_registry.load_default_model()
    from app.orchestration.pipeline import pipeline_orchestrator
    content = Path('AuditGraph_Demo_SME_Ledger.xlsx').read_bytes()
    ref, rows = load_dataset(content, 'unseen.xlsx', 'ds_unseen_release')
    with patch.object(IsolationForest, 'fit', side_effect=AssertionError('Runtime fit forbidden')), \
         patch.object(IsolationForest, 'fit_predict', side_effect=AssertionError('Runtime fit_predict forbidden')):
        result = await pipeline_orchestrator.run_pipeline('release_unseen', ref.sha256, rows)
    assert result['status'] == 'READY', result.get('degraded_reasons')
    assert any(f['detector_name'] == 'isolation_forest' for f in result['findings'])
