from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass(frozen=True, slots=True)
class IntelligenceContext:
    owner_id: str
    locale: str = "en"
    timezone: str = "UTC"
    currency: str = "USD"
    generated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.owner_id.strip():
            raise ValueError("owner_id is required")

        if not self.locale.strip():
            raise ValueError("locale is required")

        if not self.timezone.strip():
            raise ValueError("timezone is required")

        if not self.currency.strip():
            raise ValueError("currency is required")
