import pytest
from app.copilot.providers.fallback_provider import DeterministicFallbackProvider
from app.copilot.schemas import CopilotMessageRequest
from app.copilot.service import copilot_service
from app.copilot.tools.registry import copilot_tools
from app.domain.enums import Severity
from app.persistence.store import stage_store


@pytest.fixture
def evidence_run(monkeypatch):
    monkeypatch.setattr('app.copilot.service.get_llm_provider', lambda: DeterministicFallbackProvider())
    hero = {
        'case_id': 'evidence-hero', 'title': 'Delayed posting from Example Supplier',
        'risk_score': 91.3, 'severity': Severity.CRITICAL, 'monetary_exposure': 731200,
        'anomaly_types': ['BACKDATED_POSTING', 'GST_BOOK_MISMATCH'],
        'transaction_ids': ['entry-delayed'], 'entity_ids': ['Example Supplier'],
        'evidence': [{'key': 'posting_delay_days', 'label': 'Posting delay', 'value': 43, 'unit': 'days'}],
        'graph_payload': None,
    }
    cycle = {
        'case_id': 'evidence-cycle', 'title': 'Circular flow', 'risk_score': 88,
        'severity': 'HIGH', 'monetary_exposure': 73100, 'anomaly_types': ['ROUND_TRIP'],
        'transaction_ids': ['entry-a', 'entry-b', 'entry-c'], 'entity_ids': ['Node C', 'Node A', 'Node B'],
        'graph_payload': {'nodes': [{'id': x} for x in ['Node A', 'Node B', 'Node C']], 'edges': [
            {'source': 'Node A', 'target': 'Node B', 'amount_inr': 73100, 'transaction_id': 'entry-a', 'posted_at': '2026-02-01'},
            {'source': 'Node B', 'target': 'Node C', 'amount_inr': 72900, 'transaction_id': 'entry-b', 'posted_at': '2026-02-02'},
            {'source': 'Node C', 'target': 'Node A', 'amount_inr': 73000, 'transaction_id': 'entry-c', 'posted_at': '2026-02-03'},
        ]},
    }
    stage_store.save_run_result('evidence-run', {'run_id': 'evidence-run', 'status': 'READY', 'cases': [hero, cycle]})
    return 'evidence-run'


@pytest.mark.asyncio
async def test_six_questions_keep_selected_case_and_answer_intent(evidence_run):
    questions = [
        ('Why was this finding flagged?', 'evidence-hero', ['43 days', 'entry-delayed', 'Example Supplier', 'BACKDATED_POSTING']),
        ('Which transactions and evidence are involved?', 'evidence-hero', ['entry-delayed', '43 days']),
        ('What should a Chartered Accountant verify next?', 'evidence-hero', ['posting audit trail', 'entry-delayed']),
        ('Trace the circular money flow in this audit.', 'evidence-cycle', ['Node A → Node B', 'Node B → Node C', 'Node C → Node A', '73,100.00', '72,900.00', 'entry-c']),
        ('Is this definitely fraud?', 'evidence-hero', ['does not classify', 'evidence-hero']),
        ('What supporting documents should I request?', 'evidence-hero', ['Supporting documents', 'posting audit trail', 'GSTR-2B', 'entry-delayed']),
    ]
    for question, case_id, expected in questions:
        response = await copilot_service.process_message('evidence-session', evidence_run,
            CopilotMessageRequest(message=question, selected_case_id=case_id))
        assert response.mode == 'deterministic_fallback'
        assert 'get_finding' in response.used_tools
        assert all(text in response.answer for text in expected), response.answer
        assert 'Severity.' not in response.answer and "{'key':" not in response.answer
        assert any(c.source_id == case_id for c in response.citations)


def test_hero_without_graph_is_not_reported_as_a_cycle(evidence_run):
    assert copilot_tools.trace_money_flow(evidence_run, 'evidence-hero')['cycle_detected'] is False
    assert copilot_tools.trace_money_flow(evidence_run, 'evidence-cycle')['cycle_detected'] is True


@pytest.mark.asyncio
async def test_case_from_another_run_never_leaks_into_answer(evidence_run):
    stage_store.save_run_result('empty-evidence-run', {'run_id': 'empty-evidence-run', 'status': 'READY', 'cases': []})
    response = await copilot_service.process_message('other-session', 'empty-evidence-run',
        CopilotMessageRequest(message='Which transactions and evidence are involved?', selected_case_id='evidence-hero'))
    assert 'Example Supplier' not in response.answer and 'entry-delayed' not in response.answer
