"""
AuditGraph ML Preprocessing
Shared, leakage-safe feature engineering pipeline used identically in offline training and production inference.
"""

from collections import defaultdict
from datetime import date
import math
import numpy as np
from app.domain.models import CanonicalTransaction
from app.ml.feature_schema import FEATURE_NAMES


def compute_roundness(amount: float) -> float:
    """Evaluate financial amount roundness heuristic."""
    if amount <= 0:
        return 0.0
    if amount % 100000 == 0:
        return 1.0
    if amount % 10000 == 0:
        return 0.75
    if amount % 1000 == 0:
        return 0.50
    if amount % 100 == 0:
        return 0.25
    return 0.0


def extract_feature_matrix(
    transactions: list[CanonicalTransaction],
) -> tuple[np.ndarray, list[str]]:
    """
    Extract numeric feature matrix strictly obeying FEATURE_NAMES schema.
    Returns:
        X: numpy 2D array of shape (N, len(FEATURE_NAMES))
        transaction_ids: list of N transaction IDs
    """
    if not transactions:
        return np.empty((0, len(FEATURE_NAMES)), dtype=np.float64), []

    n_txns = len(transactions)
    total_count = float(n_txns)

    amounts = [float(abs(t.amount)) for t in transactions]
    amounts_arr = np.array(amounts, dtype=np.float64)

    # General ledger statistics
    med = float(np.median(amounts_arr))
    mad = float(np.median(np.abs(amounts_arr - med)))
    scale = 1.4826 * mad if mad > 0 else (float(np.std(amounts_arr)) + 1.0)

    # Counterparty groupings
    cp_counts = defaultdict(int)
    cp_amounts = defaultdict(list)
    for t in transactions:
        cp = t.entity_id or t.counterparty_name or "UNKNOWN_COUNTERPARTY"
        cp_counts[cp] += 1
        cp_amounts[cp].append(float(abs(t.amount)))

    cp_stats = {}
    for cp, amts in cp_amounts.items():
        arr = np.array(amts, dtype=np.float64)
        c_mean = float(np.mean(arr))
        c_std = float(np.std(arr)) if len(arr) > 1 else 1.0
        cp_stats[cp] = (c_mean, c_std)

    rows: list[list[float]] = []
    transaction_ids: list[str] = []

    for idx, t in enumerate(transactions):
        transaction_ids.append(t.transaction_id)
        amt_float = amounts[idx]

        # 1. log_abs_amount
        log_amt = math.log1p(amt_float)

        # 2. amount_rel_median
        rel_med = amt_float / (med + 1.0) if med > 0 else 1.0

        # 3. robust_amount_z
        robust_z = (amt_float - med) / scale if scale > 0 else 0.0

        # 4. vendor_freq
        cp = t.entity_id or t.counterparty_name or "UNKNOWN_COUNTERPARTY"
        v_freq = cp_counts[cp] / total_count

        # 5. vendor_amt_dev
        c_mean, c_std = cp_stats.get(cp, (amt_float, 1.0))
        v_dev = (amt_float - c_mean) / (c_std + 1.0)

        # 6. doc_posting_gap (controlled imputation if dates missing)
        p_dt = t.posting_date
        d_dt = t.document_date
        if p_dt and d_dt:
            gap = float((p_dt - d_dt).days)
        else:
            gap = 0.0

        # 7. posting_day & 8. posting_month
        if p_dt:
            p_day = float(p_dt.day)
            p_month = float(p_dt.month)
            # 9. period_end_proximity (days to FY end March 31)
            target_year = p_dt.year if p_dt.month <= 3 else p_dt.year + 1
            fy_end = date(target_year, 3, 31)
            days_to_fy = float(abs((fy_end - p_dt).days))
        else:
            p_day = 15.0
            p_month = 6.0
            days_to_fy = 60.0

        # 10. is_manual_entry
        is_manual = 1.0 if t.is_manual_entry else 0.0

        # 11. roundness_score
        round_s = compute_roundness(amt_float)

        # 12. gst_ratio
        if t.gst_amount is not None and amt_float > 0:
            gst_rat = float(abs(t.gst_amount)) / amt_float
        else:
            gst_rat = 0.0

        row = [
            log_amt,
            rel_med,
            robust_z,
            v_freq,
            v_dev,
            gap,
            p_day,
            p_month,
            days_to_fy,
            is_manual,
            round_s,
            gst_rat,
        ]
        rows.append(row)

    X = np.array(rows, dtype=np.float64)
    # Sanitize NaNs or Infs safely
    X = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)
    return X, transaction_ids
