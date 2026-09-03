from app.domain.errors import DatasetSchemaIncompleteException


def validate_canonical_schema(mapping: dict[str, str], headers: list[str]) -> bool:
    """Ensure the mapped schema contains minimum required fields."""
    canonical_mapped = set(mapping.values())

    required = {"posting_date", "amount"}
    missing = required - canonical_mapped

    if missing:
        raise DatasetSchemaIncompleteException(
            message=f"Dataset is missing required canonical fields: {', '.join(missing)}",
            details={
                "required_fields": list(required),
                "mapped_fields": list(canonical_mapped),
                "missing_fields": list(missing),
                "headers": headers,
            },
        )

    return True
