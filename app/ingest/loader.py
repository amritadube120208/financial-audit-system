import io
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Any
import pandas as pd
from app.domain.models import CanonicalTransaction, DatasetRef
from app.domain.errors import DatasetUnreadableException
from app.ingest.fingerprint import compute_sha256
from app.ingest.schema_mapper import map_columns
from app.ingest.validator import validate_canonical_schema


def _parse_date(val: Any) -> date | None:
    if val is None or pd.isna(val):
        return None

    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val

    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("none", "nan", "null"):
        return None

    try:
        parts = val_str.split("T")[0].split(" ")[0]
        if "-" in parts:
            p = parts.split("-")
            if len(p[0]) == 4:
                return date(int(p[0]), int(p[1]), int(p[2]))
            else:
                return date(int(p[2]), int(p[1]), int(p[0]))
        elif "/" in parts:
            p = parts.split("/")
            if len(p[0]) == 4:
                return date(int(p[0]), int(p[1]), int(p[2]))
            else:
                return date(int(p[2]), int(p[1]), int(p[0]))
    except Exception:
        pass

    try:
        dt = pd.to_datetime(val_str)
        return dt.date()
    except Exception:
        return None


def _parse_decimal(val: Any) -> Decimal:
    if val is None or pd.isna(val):
        return Decimal("0.00")
    if isinstance(val, (int, float)):
        return Decimal(str(val))

    val_str = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
    if not val_str or val_str.lower() in ("none", "nan", "null"):
        return Decimal("0.00")

    try:
        return Decimal(val_str)
    except (ValueError, InvalidOperation):
        try:
            return Decimal(str(float(val_str)))
        except Exception:
            return Decimal("0.00")


def load_dataset(
    content: bytes,
    filename: str,
    dataset_id: str,
) -> tuple[DatasetRef, list[CanonicalTransaction]]:
    """
    Ingest raw CSV/XLSX bytes, map columns, validate schema, and convert rows into CanonicalTransaction objects.
    Optimized for high-performance ingestion of 100,000+ transaction rows.
    """
    sha256 = compute_sha256(content)
    size_bytes = len(content)

    ext = filename.split(".")[-1].lower() if "." in filename else ""

    try:
        if ext in ("xlsx", "xls"):
            xl = pd.ExcelFile(io.BytesIO(content))
            sheet = "Ledger" if "Ledger" in xl.sheet_names else 0
            df = pd.read_excel(xl, sheet_name=sheet, dtype=str)
        else:
            df = pd.read_csv(io.BytesIO(content), dtype=str)
    except Exception as exc:
        raise DatasetUnreadableException(
            message=f"Failed to parse uploaded dataset file '{filename}': {str(exc)}"
        )

    headers = [str(col).strip() for col in df.columns]
    df.columns = headers
    mapping, warnings = map_columns(headers)
    validate_canonical_schema(mapping, headers)

    # Invert mapping: {canonical_name: raw_column_name}
    canonical_to_raw = {v: k for k, v in mapping.items()}

    col_tx_id = canonical_to_raw.get("transaction_id")
    col_pdate = canonical_to_raw.get("posting_date")
    col_ddate = canonical_to_raw.get("document_date")
    col_amount = canonical_to_raw.get("amount")
    col_gst_amt = canonical_to_raw.get("gst_amount")
    col_cp = canonical_to_raw.get("counterparty_name")
    col_inv = canonical_to_raw.get("invoice_number")
    col_ref = canonical_to_raw.get("reference_number")
    col_dr = canonical_to_raw.get("debit_account")
    col_cr = canonical_to_raw.get("credit_account")
    col_narr = canonical_to_raw.get("narration")
    col_manual = canonical_to_raw.get("is_manual_entry")
    col_gstin = canonical_to_raw.get("gstin")

    records = df.to_dict("records")
    transactions: list[CanonicalTransaction] = []

    for idx, row in enumerate(records):
        source_row_num = idx + 2

        t_id_val = row.get(col_tx_id) if col_tx_id else None
        txn_id = str(t_id_val).strip() if t_id_val and not pd.isna(t_id_val) else f"TXN-{dataset_id[:6]}-{idx+1:06d}"

        posting_dt = _parse_date(row.get(col_pdate) if col_pdate else None)
        doc_dt_val = row.get(col_ddate) if col_ddate else None
        doc_dt = _parse_date(doc_dt_val) if doc_dt_val and not pd.isna(doc_dt_val) else None

        amount = _parse_decimal(row.get(col_amount) if col_amount else None)
        gst_val = row.get(col_gst_amt) if col_gst_amt else None
        gst_amt = _parse_decimal(gst_val) if gst_val is not None and not pd.isna(gst_val) else None

        cp_val = row.get(col_cp) if col_cp else None
        cp_str = str(cp_val).strip() if cp_val and not pd.isna(cp_val) else None
        entity_str = cp_str or "UNKNOWN_ENTITY"

        inv_val = row.get(col_inv) if col_inv else None
        inv_str = str(inv_val).strip() if inv_val and not pd.isna(inv_val) else None

        ref_val = row.get(col_ref) if col_ref else None
        ref_str = str(ref_val).strip() if ref_val and not pd.isna(ref_val) else None

        dr_val = row.get(col_dr) if col_dr else None
        cr_val = row.get(col_cr) if col_cr else None
        narr_val = row.get(col_narr) if col_narr else None
        man_val = row.get(col_manual) if col_manual else None
        gstin_val = row.get(col_gstin) if col_gstin else None

        is_manual = str(man_val).strip().lower() in ("true", "1", "yes", "manual") if man_val else False

        if posting_dt is None:
            warnings.append(f"Row {source_row_num}: Invalid or missing posting date")
            fy_str = None
            month_val = None
            day_val = None
        else:
            fy_str = f"FY{posting_dt.year + 1 - 2000:02d}" if posting_dt.month >= 4 else f"FY{posting_dt.year - 2000:02d}"
            month_val = posting_dt.month
            day_val = posting_dt.day

        txn = CanonicalTransaction(
            transaction_id=txn_id,
            dataset_id=dataset_id,
            posting_date=posting_dt,
            document_date=doc_dt,
            fiscal_year=fy_str,
            month=month_val,
            day_of_month=day_val,
            invoice_number=inv_str,
            reference_number=ref_str,
            entity_id=entity_str,
            counterparty_id=entity_str,
            counterparty_name=cp_str,
            debit_account=str(dr_val).strip() if dr_val and not pd.isna(dr_val) else None,
            credit_account=str(cr_val).strip() if cr_val and not pd.isna(cr_val) else None,
            amount=amount,
            currency="INR",
            gst_amount=gst_amt,
            gstin=str(gstin_val).strip() if gstin_val and not pd.isna(gstin_val) else None,
            narration=str(narr_val).strip() if narr_val and not pd.isna(narr_val) else None,
            is_manual_entry=is_manual,
            source_system="CSV_UPLOAD",
            source_row_number=source_row_num,
        )
        transactions.append(txn)

    dataset_ref = DatasetRef(
        dataset_id=dataset_id,
        filename=filename,
        sha256=sha256,
        size_bytes=size_bytes,
        row_count=len(transactions),
        column_count=len(headers),
        detected_format=ext,
        canonical_mapping=mapping,
        warnings=warnings,
        created_at=datetime.utcnow().isoformat(),
    )

    return dataset_ref, transactions
