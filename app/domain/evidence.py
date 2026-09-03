from typing import Any
from pydantic import BaseModel, ConfigDict
from app.domain.enums import EvidenceSource


class EvidenceItem(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    key: str
    label: str
    value: Any
    unit: str | None = None
    source: EvidenceSource = EvidenceSource.DERIVED
