from typing import Any
from fastapi import HTTPException, status


class AuditGraphException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class DatasetUnreadableException(AuditGraphException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code="DATASET_UNREADABLE",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class DatasetSchemaIncompleteException(AuditGraphException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code="DATASET_SCHEMA_INCOMPLETE",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class RunNotFoundException(AuditGraphException):
    def __init__(self, run_id: str):
        super().__init__(
            code="RUN_NOT_FOUND",
            message=f"Audit run '{run_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class FindingNotFoundException(AuditGraphException):
    def __init__(self, finding_id: str):
        super().__init__(
            code="FINDING_NOT_FOUND",
            message=f"Finding '{finding_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class CaseNotFoundException(AuditGraphException):
    def __init__(self, case_id: str):
        super().__init__(
            code="CASE_NOT_FOUND",
            message=f"Case '{case_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class IdempotencyConflictException(AuditGraphException):
    def __init__(self, message: str):
        super().__init__(
            code="IDEMPOTENCY_CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
        )


class CopilotUngroundedException(AuditGraphException):
    def __init__(self, message: str):
        super().__init__(
            code="COPILOT_UNGROUNDED_REQUEST",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
