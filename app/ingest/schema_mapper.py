import re
from rapidfuzz import fuzz

COLUMN_ALIASES = {
    "transaction_id": [
        "transaction_id", "transaction id", "txn_id", "txn id", "entry_id",
        "voucher_id", "id", "sl_no", "sr_no", "row_id"
    ],
    "posting_date": [
        "posting_date", "posting date", "date", "transaction_date", "entry_date",
        "voucher_date", "txn_date"
    ],
    "document_date": [
        "document_date", "document date", "doc_date", "bill_date", "inv_date", "invoice_date"
    ],
    "amount": [
        "amount", "txn_amount", "transaction_amount", "value", "net_amount",
        "total_amount", "dr_cr_amount"
    ],
    "invoice_number": [
        "invoice", "invoice_no", "invoice_number", "bill_no", "bill_number",
        "doc_no", "document_no"
    ],
    "reference_number": [
        "reference_number", "reference", "ref_no", "ref_number", "cheque_no"
    ],
    "counterparty_name": [
        "vendor", "vendor_name", "supplier", "party_name", "counterparty",
        "customer", "customer_name", "party"
    ],
    "debit_account": ["debit_account", "debit account", "dr_account", "debit"],
    "credit_account": ["credit_account", "credit account", "cr_account", "credit"],
    "narration": ["narration", "description", "remarks", "memo", "particulars", "details"],
    "is_manual_entry": ["is_manual_entry", "manual", "entry_mode", "user_entry"],
    "gst_amount": ["gst_amount", "gst", "tax_amount", "cgst_sgst", "igst"],
    "gstin": ["gstin", "gst_no", "tax_id", "gst_number"]
}


def _normalize_str(s: str) -> str:
    return re.sub(r"[_\s\-\.]+", "", s.strip().lower())


def map_columns(headers: list[str]) -> tuple[dict[str, str], list[str]]:
    """
    Map raw file column names to canonical field names.
    Returns:
        canonical_mapping: {raw_column_name: canonical_field_name}
        warnings: list of warning messages for missing optional fields
    """
    mapping: dict[str, str] = {}
    used_canonical: set[str] = set()
    warnings: list[str] = []

    normalized_headers = {h: _normalize_str(h) for h in headers}

    # Pass 1: Exact / Known alias match
    for canonical_field, aliases in COLUMN_ALIASES.items():
        if canonical_field in used_canonical:
            continue

        alias_norms = [_normalize_str(a) for a in aliases]

        for raw_col, raw_norm in normalized_headers.items():
            if raw_col in mapping:
                continue

            if raw_norm in alias_norms:
                mapping[raw_col] = canonical_field
                used_canonical.add(canonical_field)
                break

    # Pass 2: Fuzzy match for unmapped canonical fields
    for canonical_field, aliases in COLUMN_ALIASES.items():
        if canonical_field in used_canonical:
            continue

        best_score = 0
        best_col = None

        for raw_col in headers:
            if raw_col in mapping:
                continue

            raw_norm = normalized_headers[raw_col]
            for alias in aliases:
                score = fuzz.ratio(raw_norm, _normalize_str(alias))
                if score > best_score:
                    best_score = score
                    best_col = raw_col

        if best_col and best_score >= 85:
            mapping[best_col] = canonical_field
            used_canonical.add(canonical_field)

    # Required column checks
    if "posting_date" not in used_canonical:
        warnings.append("Missing recommended 'posting_date' column. Will attempt fallback parsing.")
    if "amount" not in used_canonical:
        warnings.append("Missing recommended 'amount' column.")
    if "counterparty_name" not in used_canonical:
        warnings.append("Optional 'counterparty_name' not mapped. Counterparty analytics will be constrained.")

    return mapping, warnings
