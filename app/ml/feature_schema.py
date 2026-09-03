"""
AuditGraph ML Feature Schema
Canonical feature definitions and versioning for offline model training and inference.
"""

FEATURE_SCHEMA_VERSION = "1.0.0"

FEATURE_NAMES = [
    "log_abs_amount",
    "amount_rel_median",
    "robust_amount_z",
    "vendor_freq",
    "vendor_amt_dev",
    "doc_posting_gap",
    "posting_day",
    "posting_month",
    "period_end_proximity",
    "is_manual_entry",
    "roundness_score",
    "gst_ratio",
]

FEATURE_DESCRIPTIONS = {
    "log_abs_amount": "Natural log of 1 + transaction absolute amount in INR.",
    "amount_rel_median": "Ratio of transaction amount to general ledger median amount.",
    "robust_amount_z": "Modified z-score using median absolute deviation (MAD).",
    "vendor_freq": "Relative transaction frequency of the vendor/counterparty.",
    "vendor_amt_dev": "Standard deviations from vendor-specific mean transaction amount.",
    "doc_posting_gap": "Elapsed calendar days between document issuance and posting date.",
    "posting_day": "Calendar day of month for posting (1-31).",
    "posting_month": "Calendar month for posting (1-12).",
    "period_end_proximity": "Days remaining until fiscal year-end cut-off (March 31).",
    "is_manual_entry": "Binary indicator (1.0 = manual journal voucher, 0.0 = automated system entry).",
    "roundness_score": "Heuristic score for suspiciously round settlement amounts.",
    "gst_ratio": "Ratio of recorded GST to base transaction amount.",
}
