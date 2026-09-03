import json
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ingest.loader import load_dataset
from app.features.builder import build_feature_matrix
from app.detectors.rules.rules_suite import RulesDetector
from app.detectors.anomaly.isolation_forest import IsolationForestDetector
from app.detectors.graph.graph_cycles import GraphCycleDetector
from app.cases.builder import build_investigation_cases
from app.explain.deterministic import attach_deterministic_explanations
import time


def run_benchmark(dataset_path: str = "data/demo/auditgraph_demo_100k.csv"):
    path = Path(dataset_path)
    if not path.exists():
        print(f"Error: Dataset {dataset_path} not found. Run scripts/generate_demo_dataset.py first.")
        sys.exit(1)

    print("==================================================")
    print(" AUDITGRAPH PIPELINE PERFORMANCE BENCHMARK")
    print(f" Dataset: {dataset_path}")
    print("==================================================\n")

    with open(path, "rb") as f:
        content = f.read()

    # 1. Ingestion Benchmark
    t0 = time.time()
    ds_ref, transactions = load_dataset(content=content, filename=path.name, dataset_id="ds_bench_100k")
    t_ingest = (time.time() - t0) * 1000.0
    print(f"1. Ingestion & Canonicalization: {t_ingest:.1f} ms ({len(transactions):,} rows)")

    # 2. Feature Building Benchmark
    t0 = time.time()
    X, txn_ids, feat_names = build_feature_matrix(transactions)
    t_features = (time.time() - t0) * 1000.0
    print(f"2. Feature Matrix Building:     {t_features:.1f} ms (shape: {X.shape})")

    # 3. Deterministic Rules Benchmark
    rules_detector = RulesDetector()
    t0 = time.time()
    rule_findings = rules_detector.run(transactions, run_id="run_bench")
    t_rules = (time.time() - t0) * 1000.0
    print(f"3. Deterministic Rules Engine:   {t_rules:.1f} ms ({len(rule_findings)} findings)")

    # 4. IsolationForest ML Benchmark
    ml_detector = IsolationForestDetector()
    t0 = time.time()
    ml_findings = ml_detector.run(transactions, run_id="run_bench")
    t_ml = (time.time() - t0) * 1000.0
    print(f"4. IsolationForest ML Engine:   {t_ml:.1f} ms ({len(ml_findings)} findings)")

    # 5. Graph Forensics Engine Benchmark
    graph_detector = GraphCycleDetector()
    t0 = time.time()
    graph_findings = graph_detector.run(transactions, run_id="run_bench")
    t_graph = (time.time() - t0) * 1000.0
    print(f"5. Graph Forensics Engine:       {t_graph:.1f} ms ({len(graph_findings)} cycle findings)")

    # 6. Risk Fusion & Case Building Benchmark
    all_findings = rule_findings + ml_findings + graph_findings
    t0 = time.time()
    cases = build_investigation_cases(all_findings, run_id="run_bench", materiality_threshold=Decimal("50000"))
    cases = attach_deterministic_explanations(cases)
    t_cases = (time.time() - t0) * 1000.0
    print(f"6. Risk Fusion & Case Builder:   {t_cases:.1f} ms ({len(cases)} cases built)")

    total_time_ms = t_ingest + t_features + t_rules + t_ml + t_graph + t_cases

    # Calculate review surface reduction percentage
    reduction_pct = (1.0 - (len(cases) / float(len(transactions)))) * 100.0

    print("\n==================================================")
    print(" BENCHMARK SUMMARY RESULTS")
    print("==================================================")
    print(f" Total Transactions Analyzed: {len(transactions):,}")
    print(f" Total Raw Detector Flags:   {len(all_findings):,}")
    print(f" Prioritized Case Queue:      {len(cases)} investigations")
    print(f" First-Pass Review Reduction: {reduction_pct:.3f}%")
    print(f" Total End-to-End Latency:   {total_time_ms:.1f} ms ({total_time_ms/1000.0:.2f} s)")
    print("==================================================\n")

    report_data = {
        "dataset_rows": len(transactions),
        "raw_flags": len(all_findings),
        "prioritized_cases": len(cases),
        "review_surface_reduction_pct": round(reduction_pct, 3),
        "latencies_ms": {
            "ingestion": round(t_ingest, 1),
            "features": round(t_features, 1),
            "rules": round(t_rules, 1),
            "isolation_forest": round(t_ml, 1),
            "graph_cycles": round(t_graph, 1),
            "case_builder": round(t_cases, 1),
            "total_pipeline": round(total_time_ms, 1),
        },
    }

    with open("data/benchmark_results.json", "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    return report_data


if __name__ == "__main__":
    run_benchmark()
