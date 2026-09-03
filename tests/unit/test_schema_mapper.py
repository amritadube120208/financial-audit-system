from app.ingest.schema_mapper import map_columns


def test_map_columns_exact_and_fuzzy():
    headers = [
        "Txn ID",
        "Posting Date",
        "Value",
        "Vendor Name",
        "Invoice No",
        "Description",
    ]

    mapping, warnings = map_columns(headers)

    assert mapping.get("Txn ID") == "transaction_id"
    assert mapping.get("Posting Date") == "posting_date"
    assert mapping.get("Value") == "amount"
    assert mapping.get("Vendor Name") == "counterparty_name"
    assert mapping.get("Invoice No") == "invoice_number"
    assert mapping.get("Description") == "narration"
