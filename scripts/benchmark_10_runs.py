import asyncio
import json
import os
import sys
import time
import statistics
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ingest.loader import load_dataset
from app.orchestration.pipeline import pipeline_orchestrator

dataset_path = "data/demo/auditgraph_demo_100k.csv"
with open(dataset_path, "rb") as f:
    content = f.read()


async def run_10_benchmarks():
    print("==================================================")
    print(" RUNNING 10 PIPELINE BENCHMARK ITERATIONS (100K ROWS)")
    print("==================================================")

    latencies = []
    runs_data = []

    for i in range(1, 11):
        t0 = time.time()
        ref, txns = load_dataset(content=content, filename="auditgraph_demo_100k.csv", dataset_id=f"ds_bench_{i}")
        run_id = f"run_bench_{i}"
        res = await pipeline_orchestrator.run_pipeline(run_id=run_id, dataset_sha256=ref.sha256, transactions=txns)
        duration = (time.time() - t0) * 1000.0

        latencies.append(duration)
        runs_data.append({"iteration": i, "duration_ms": round(duration, 1), "type": "cold" if i <= 5 else "warm"})
        print(f"Run {i:02d} ({'Cold' if i<=5 else 'Warm'}): {duration:.1f} ms | Status: {res.get('status')}")

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95) - 1]
    min_lat = min(latencies)
    max_lat = max(latencies)

    print("\n==================================================")
    print(" 10-RUN BENCHMARK SUMMARY")
    print("==================================================")
    print(f" P50 Latency: {p50:.1f} ms ({p50/1000:.2f} s)")
    print(f" P95 Latency: {p95:.1f} ms ({p95/1000:.2f} s)")
    print(f" Min Latency: {min_lat:.1f} ms ({min_lat/1000:.2f} s)")
    print(f" Max Latency: {max_lat:.1f} ms ({max_lat/1000:.2f} s)")
    print("==================================================")

    summary = {
        "iterations": 10,
        "p50_ms": round(p50, 1),
        "p95_ms": round(p95, 1),
        "min_ms": round(min_lat, 1),
        "max_ms": round(max_lat, 1),
        "runs": runs_data,
    }

    Path("data").mkdir(exist_ok=True)
    with open("data/PERFORMANCE_10_RUNS.json", "w") as f:
        json.dump(summary, f, indent=2)


if __name__ == "__main__":
    asyncio.run(run_10_benchmarks())
