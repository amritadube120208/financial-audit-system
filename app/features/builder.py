import math
from collections import defaultdict
from datetime import date
from decimal import Decimal
import numpy as np
import pandas as pd
from app.domain.models import CanonicalTransaction


FEATURE_NAMES = [
    "log_abs_amount",
    "vendor_transaction_frequency",
    "account_transaction_frequency",
    "vendor_amount_robust_z",
    "days_from_month_end",
    "days_from_year_end",
    "is_weekend",
    "is_manual_entry",
    "counterparty_rarity",
    "roundness_score",
    "posting_document_gap",
]


def build_feature_matrix(
    transactions: list[CanonicalTransaction]
) -> tuple[np.ndarray, list[str], list[str]]:
    """
    Build a unified numeric feature matrix from canonical transactions.
    """
    if not transactions:
        return np.empty((0, len(FEATURE_NAMES))), [], FEATURE_NAMES

    total_count = float(len(transactions))
    cp_counts = defaultdict(int)
    acc_counts = defaultdict(int)
    cp_amounts = defaultdict(list)

    for t in transactions:
        cp = t.entity_id or "UNKNOWN"
        cp_counts[cp] += 1
        cp_amounts[cp].append(float(abs(t.amount)))
        if t.debit_account:
            acc_counts[t.debit_account] += 1
        if t.credit_account:
            acc_counts[t.credit_account] += 1

    # Pre-calculate median and MAD per counterparty
    cp_stats = {}
    for cp, amts in cp_amounts.items():
        arr = np.array(amts)
        med = np.median(arr)
        mad = np.median(np.abs(arr - med))
        scale = 1.4826 * mad if mad > 0 else (np.std(arr) + 1e-6)
        cp_stats[cp] = (med, scale)

    rows = []
    transaction_ids = []

    for t in transactions:
        transaction_ids.append(t.transaction_id)
        amt_float = float(abs(t.amount))

        log_amt = math.log1p(amt_float)

        cp = t.entity_id or "UNKNOWN"
        vendor_freq = cp_counts[cp] / total_count

        acc = t.debit_account or t.credit_account or "UNKNOWN"
        acc_freq = acc_counts[acc] / total_count

        med, scale = cp_stats.get(cp, (amt_float, 1.0))
        robust_z = (amt_float - med) / scale if scale > 0 else 0.0

        p_dt = t.posting_date
        days_from_month_end = float(31 - p_dt.day if p_dt.month in (1,3,5,7,8,10,12) else 30 - p_dt.day)

        if p_dt.month <= 3:
            fy_end = date(p_dt.year, 3, 31)
        else:
            fy_end = date(p_dt.year + 1, 3, 31)
        days_from_year_end = float((fy_end - p_dt).days)

        is_weekend = 1.0 if p_dt.weekday() >= 5 else 0.0
        is_manual = 1.0 if t.is_manual_entry else 0.0
        cp_rarity = 1.0 - vendor_freq

        roundness = 0.0
        amt_dec = abs(t.amount)
        if amt_dec > 0:
            if amt_dec % Decimal("100000") == 0:
                roundness = 1.0
            elif amt_dec % Decimal("10000") == 0:
                roundness = 0.7
            elif amt_dec % Decimal("1000") == 0:
                roundness = 0.4

        gap = float((p_dt - t.document_date).days) if t.document_date else 0.0

        vector = [
            log_amt,
            vendor_freq,
            acc_freq,
            robust_z,
            days_from_month_end,
            days_from_year_end,
            is_weekend,
            is_manual,
            cp_rarity,
            roundness,
            gap,
        ]
        rows.append(vector)

    X = np.array(rows, dtype=np.float64)
    return X, transaction_ids, FEATURE_NAMES
