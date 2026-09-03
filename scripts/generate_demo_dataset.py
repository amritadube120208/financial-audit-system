import json
import random
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
import pandas as pd


def generate_synthetic_dataset(
    output_csv: str = "data/demo/auditgraph_demo_100k.csv",
    output_gt: str = "data/demo/ground_truth.json",
    num_rows: int = 100000,
    seed: int = 42,
):
    random.seed(seed)
    Path(output_csv).parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating synthetic financial ledger with {num_rows:,} rows (seed={seed})...")

    # Counterparties
    vendors = [f"VENDOR_{i:04d}" for i in range(1, 201)]
    vendors.extend(["VENDOR_X17", "VENDOR_Y09", "VENDOR_Z03"])
    customers = [f"CUSTOMER_{i:04d}" for i in range(1, 101)]

    # Accounts
    debit_accounts = ["Vendor Advances", "Raw Material Purchases", "Operating Expenses", "Professional Fees", "Capital Expenditure", "Rent Expense"]
    credit_accounts = ["HDFC Current Account", "ICICI Bank Account", "SBI Corporate Account", "Accounts Payable"]

    start_date = date(2025, 4, 1)
    end_date = date(2026, 3, 31)
    date_range_days = (end_date - start_date).days

    rows = []
    ground_truth = {}

    # Generate baseline normal transactions
    for i in range(1, num_rows + 1 - 250):
        t_id = f"TXN-{i:06d}"
        days_offset = random.randint(0, date_range_days)
        p_dt = start_date + timedelta(days=days_offset)

        # Log-normal transaction amounts between 500 and 150000
        amt = Decimal(str(round(random.lognormvariate(8.5, 1.2), 2)))
        amt = max(Decimal("150.00"), min(amt, Decimal("250000.00")))

        cp = random.choice(vendors)
        dr_acc = random.choice(debit_accounts)
        cr_acc = random.choice(credit_accounts)
        inv_no = f"INV-2025-{random.randint(1000, 9999)}"

        rows.append({
            "transaction_id": t_id,
            "posting_date": p_dt.isoformat(),
            "document_date": (p_dt - timedelta(days=random.randint(0, 3))).isoformat(),
            "amount": str(amt),
            "vendor_name": cp,
            "invoice_number": inv_no,
            "debit_account": dr_acc,
            "credit_account": cr_acc,
            "narration": f"Payment for {dr_acc.lower()} to {cp}",
            "is_manual_entry": "False",
            "gst_amount": str(round(amt * Decimal("0.18"), 2)),
            "gstin": f"27ABCDE{random.randint(1000,9999)}F1Z5",
        })

    current_count = len(rows)

    # 1. Inject Exact Duplicates (80 instances / 40 pairs)
    print("Injecting 40 exact duplicate transaction pairs...")
    for pair in range(40):
        current_count += 1
        t1_id = f"TXN-{current_count:06d}"
        current_count += 1
        t2_id = f"TXN-{current_count:06d}"

        p_dt = start_date + timedelta(days=random.randint(30, 300))
        amt = Decimal(str(random.choice([49500, 125000, 240000, 89000])))
        cp = f"VENDOR_DUP_{pair:02d}"
        inv_no = f"INV-DUP-{pair:03d}"

        row_base = {
            "posting_date": p_dt.isoformat(),
            "document_date": p_dt.isoformat(),
            "amount": str(amt),
            "vendor_name": cp,
            "invoice_number": inv_no,
            "debit_account": "Professional Fees",
            "credit_account": "HDFC Current Account",
            "narration": f"Duplicate retainer payment to {cp}",
            "is_manual_entry": "False",
            "gst_amount": str(round(amt * Decimal("0.18"), 2)),
            "gstin": "27ABCDE9999F1Z5",
        }

        r1 = dict(row_base)
        r1["transaction_id"] = t1_id
        r2 = dict(row_base)
        r2["transaction_id"] = t2_id

        rows.extend([r1, r2])
        ground_truth[t1_id] = ["EXACT_DUPLICATE"]
        ground_truth[t2_id] = ["EXACT_DUPLICATE"]

    # 2. Inject Hero 3-Entity Graph Cycles (8 cycles / 24 transactions)
    print("Injecting 8 graph round-trip cycles...")
    for c_idx in range(1, 9):
        base_amt = 495000 - (c_idx * 5000)
        c_dt = date(2026, 3, 28 + (c_idx % 3))

        # Node A (Company) -> Node B (Vendor X) -> Node C (Vendor Y) -> Node A
        current_count += 1
        tx1 = f"TXN-CYCLE-{c_idx:02d}-1"
        current_count += 1
        tx2 = f"TXN-CYCLE-{c_idx:02d}-2"
        current_count += 1
        tx3 = f"TXN-CYCLE-{c_idx:02d}-3"

        # Edge 1: Company A -> Vendor X17
        r1 = {
            "transaction_id": tx1,
            "posting_date": c_dt.isoformat(),
            "document_date": c_dt.isoformat(),
            "amount": str(Decimal(str(base_amt))),
            "vendor_name": "VENDOR_X17",
            "invoice_number": f"INV-RT-{c_idx:02d}-A",
            "debit_account": "Vendor Advances",
            "credit_account": "HDFC Current Account",
            "narration": "Year-end strategic advance transfer",
            "is_manual_entry": "True",
            "gst_amount": str(round(Decimal(str(base_amt)) * Decimal("0.18"), 2)),
            "gstin": "27ABCDE1111F1Z5",
        }

        # Edge 2: Vendor X17 -> Vendor Y09
        r2 = {
            "transaction_id": tx2,
            "posting_date": (c_dt + timedelta(days=1)).isoformat(),
            "document_date": (c_dt + timedelta(days=1)).isoformat(),
            "amount": str(Decimal(str(base_amt - 5000))),
            "vendor_name": "VENDOR_Y09",
            "invoice_number": f"INV-RT-{c_idx:02d}-B",
            "debit_account": "VENDOR_X17",
            "credit_account": "VENDOR_Y09",
            "narration": "Subcontractor component clearing",
            "is_manual_entry": "True",
            "gst_amount": str(round(Decimal(str(base_amt - 5000)) * Decimal("0.18"), 2)),
            "gstin": "27ABCDE2222F1Z5",
        }

        # Edge 3: Vendor Y09 -> Company A
        r3 = {
            "transaction_id": tx3,
            "posting_date": (c_dt + timedelta(days=1)).isoformat(),
            "document_date": (c_dt + timedelta(days=1)).isoformat(),
            "amount": str(Decimal(str(base_amt - 7500))),
            "vendor_name": "COMPANY_MAIN_SELF",
            "invoice_number": f"INV-RT-{c_idx:02d}-C",
            "debit_account": "VENDOR_Y09",
            "credit_account": "HDFC Current Account",
            "narration": "Refund of unutilized advance",
            "is_manual_entry": "True",
            "gst_amount": str(round(Decimal(str(base_amt - 7500)) * Decimal("0.18"), 2)),
            "gstin": "27ABCDE3333F1Z5",
        }

        rows.extend([r1, r2, r3])
        ground_truth[tx1] = ["ROUND_TRIP", "PERIOD_END", "RARE_COUNTERPARTY"]
        ground_truth[tx2] = ["ROUND_TRIP", "PERIOD_END"]
        ground_truth[tx3] = ["ROUND_TRIP", "PERIOD_END"]

    # 3. Inject Backdated Manual Entries (25 rows)
    print("Injecting 25 backdated entries...")
    for b in range(25):
        current_count += 1
        t_id = f"TXN-BACKDATE-{b:02d}"
        p_dt = date(2026, 3, 29)
        doc_dt = date(2026, 1, 15)
        amt = Decimal(str(150000 + (b * 10000)))

        rows.append({
            "transaction_id": t_id,
            "posting_date": p_dt.isoformat(),
            "document_date": doc_dt.isoformat(),
            "amount": str(amt),
            "vendor_name": f"VENDOR_BD_{b:02d}",
            "invoice_number": f"INV-BD-{b:03d}",
            "debit_account": "Operating Expenses",
            "credit_account": "Accounts Payable",
            "narration": "Prior period expense adjustment journal",
            "is_manual_entry": "True",
            "gst_amount": str(round(amt * Decimal("0.18"), 2)),
            "gstin": "27ABCDE4444F1Z5",
        })
        ground_truth[t_id] = ["BACKDATED_POSTING"]

    # 4. Inject GST Book Mismatches (17 rows)
    print("Injecting 17 GST mismatch entries...")
    for g in range(17):
        current_count += 1
        t_id = f"TXN-GST-{g:02d}"
        p_dt = date(2026, 2, 10 + (g % 10))
        amt = Decimal(str(220000 + (g * 15000)))

        rows.append({
            "transaction_id": t_id,
            "posting_date": p_dt.isoformat(),
            "document_date": p_dt.isoformat(),
            "amount": str(amt),
            "vendor_name": f"VENDOR_GST_MISMATCH_{g:02d}",
            "invoice_number": f"INV-GSTR2B-MISSING-{g:03d}",
            "debit_account": "Raw Material Purchases",
            "credit_account": "HDFC Current Account",
            "narration": "GST_MISMATCH Purchase entry absent from GSTR-2B",
            "is_manual_entry": "False",
            "gst_amount": str(round(amt * Decimal("0.18"), 2)),
            "gstin": f"27GSTNO{g:04d}F1Z5",
        })
        ground_truth[t_id] = ["GST_BOOK_MISMATCH"]

    # 5. Inject Benign Large Capex Outliers (10 rows)
    print("Injecting 10 benign capex outliers...")
    for o in range(10):
        current_count += 1
        t_id = f"TXN-CAPEX-{o:02d}"
        p_dt = date(2025, 7, 15 + o)
        amt = Decimal(str(1500000 + (o * 200000)))

        rows.append({
            "transaction_id": t_id,
            "posting_date": p_dt.isoformat(),
            "document_date": p_dt.isoformat(),
            "amount": str(amt),
            "vendor_name": f"HEAVY_MACHINERY_SUPPLIER_{o:02d}",
            "invoice_number": f"INV-CAPEX-2025-{o:03d}",
            "debit_account": "Capital Expenditure",
            "credit_account": "SBI Corporate Account",
            "narration": "Approved plant machinery purchase order",
            "is_manual_entry": "False",
            "gst_amount": str(round(amt * Decimal("0.18"), 2)),
            "gstin": "27CAPEX9999F1Z5",
        })
        ground_truth[t_id] = ["BENIGN_OUTLIER"]

    # Convert to DataFrame and write CSV
    df = pd.DataFrame(rows)
    df.to_csv(output_csv, index=False)
    print(f"Saved canonical stage dataset: {output_csv} ({len(df):,} rows)")

    # Save Ground Truth Manifest
    gt_payload = {
        "seed": seed,
        "total_rows": len(df),
        "ground_truth_cases": ground_truth,
        "hero_case_id": "case_roundtrip_001",
    }
    with open(output_gt, "w", encoding="utf-8") as f:
        json.dump(gt_payload, f, indent=2)
    print(f"Saved ground truth manifest: {output_gt}")


if __name__ == "__main__":
    generate_synthetic_dataset()
