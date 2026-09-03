"""Offline IsolationForest training; companies are split before shared feature extraction."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import json
import joblib
import numpy as np
import sklearn
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, average_precision_score
from app.domain.models import CanonicalTransaction
from app.ml.feature_schema import FEATURE_NAMES, FEATURE_SCHEMA_VERSION
from app.ml.preprocessing import extract_feature_matrix

SEED = 42
MODEL_VERSION = "1.1.0"


def generate_corpus():
    rng = np.random.default_rng(SEED)
    ledgers = []
    for company in range(18):
        profile = company % 3
        count = int(rng.integers(220, 460))
        vendors = int(rng.integers(8, 35))
        rows, labels = [], []
        for i in range(count):
            anomalous = i % 29 == 0
            posted = date(2025, 4, 1) + timedelta(days=int(rng.integers(0, 365)))
            delay = int(rng.integers(45, 95) if anomalous else rng.integers(0, 4 + profile * 5))
            amount = round(float(rng.lognormal(9.2 + profile * 0.8, 0.6)) * (18 if anomalous else 1), 2)
            vendor = int(rng.integers(vendors))
            rows.append(CanonicalTransaction(
                transaction_id=f"C{company}-T{i}", dataset_id=f"company-{company}",
                posting_date=posted, document_date=posted-timedelta(days=delay),
                amount=Decimal(str(amount)), counterparty_name=f"C{company} Vendor {vendor}",
                entity_id=f"C{company}V{vendor}", invoice_number=f"C{company}-I{i}",
                reference_number=f"C{company}-R{i}", is_manual_entry=anomalous or rng.random() < 0.1,
                gst_amount=Decimal(str(round(amount * [0, .05, .12, .18][int(rng.integers(4))], 2))),
            ))
            labels.append(int(anomalous))
        ledgers.append((rows, np.asarray(labels)))
    return ledgers


def evaluate(labels, scores, threshold):
    predicted = scores >= threshold
    metrics = {"precision": float(precision_score(labels, predicted, zero_division=0)),
               "recall": float(recall_score(labels, predicted, zero_division=0)),
               "f1": float(f1_score(labels, predicted, zero_division=0)),
               "pr_auc": float(average_precision_score(labels, scores))}
    order = np.argsort(-scores)
    for k in (10, 25, 50):
        metrics[f"precision_at_{k}"] = float(labels[order[:k]].mean())
    return metrics


def train_and_export():
    corpus = generate_corpus()
    # Each ledger's contextual statistics are computed independently.
    matrices = [extract_feature_matrix(rows)[0] for rows, _ in corpus]
    def split(a, b):
        return np.concatenate(matrices[a:b]), np.concatenate([y for _, y in corpus[a:b]])
    train, _ = split(0, 12)
    validation, val_labels = split(12, 15)
    test, test_labels = split(15, 18)
    clf = IsolationForest(n_estimators=100, max_samples=min(1024, len(train)), contamination=.05,
                          random_state=SEED, n_jobs=-1)
    clf.fit(train)  # Unsupervised: no ground-truth labels are passed to fit.
    raw = -clf.decision_function(validation)
    lo, hi = float(np.percentile(raw, 5)), float(np.max(raw))
    val_scores = np.clip((raw-lo)/(hi-lo), 0, 1)
    thresholds = np.linspace(.05, .99, 95)
    threshold = float(max(thresholds, key=lambda t: f1_score(val_labels, val_scores >= t, zero_division=0)))
    test_scores = np.clip((-clf.decision_function(test)-lo)/(hi-lo), 0, 1)
    payload = [[t.model_dump(mode="json") for t in rows] for rows, _ in corpus]
    corpus_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    training_hash = hashlib.sha256(json.dumps(payload[:12], sort_keys=True).encode()).hexdigest()
    metadata = {
        "model_name": "auditgraph_isolation_forest", "model_type": "IsolationForest",
        "model_version": MODEL_VERSION, "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "training_dataset_hash": training_hash, "corpus_hash": corpus_hash,
        "training_rows": len(train), "validation_rows": len(validation), "test_rows": len(test),
        "feature_names": FEATURE_NAMES, "feature_count": len(FEATURE_NAMES),
        "threshold": threshold, "model_threshold": threshold, "random_seed": SEED,
        "sklearn_version": sklearn.__version__, "training_mode": "OFFLINE",
        "split": {"unit": "company", "train": list(range(12)), "validation": [12, 13, 14], "test": [15, 16, 17]},
        "validation_metrics": evaluate(val_labels, val_scores, threshold),
        "test_metrics": evaluate(test_labels, test_scores, threshold),
        "limitations": "Synthetic high-value/delayed-posting labels only; metrics do not estimate real-world fraud accuracy. Showcase workbook excluded.",
    }
    out = Path(__file__).resolve().parents[1] / "models"
    out.mkdir(exist_ok=True)
    joblib.dump({"estimator": clf, "threshold": threshold, "p_min": lo, "p_max": hi,
                 "model_version": MODEL_VERSION, "feature_schema_version": FEATURE_SCHEMA_VERSION,
                 "feature_means": train.mean(axis=0), "feature_stds": train.std(axis=0)+1e-6},
                out / "auditgraph_anomaly_model.joblib", compress=3)
    (out / "auditgraph_model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({"model_version": MODEL_VERSION, "test_metrics": metadata["test_metrics"]}, indent=2))

if __name__ == "__main__":
    train_and_export()
