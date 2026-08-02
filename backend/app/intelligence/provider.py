from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, runtime_checkable

from app.intelligence.context import IntelligenceContext


@dataclass(frozen=True, slots=True)
class RevenueSnapshot:
    """Read-only revenue facts supplied to intelligence builders."""

    owner_id: str
    period_start: datetime
    period_end: datetime
    currency: str
    completed_booking_count: int
    gross_revenue_minor: int
    previous_gross_revenue_minor: int
    average_ticket_minor: int

    def __post_init__(self) -> None:
        owner_id = self.owner_id.strip()
        currency = self.currency.strip().upper()

        if not owner_id:
            raise ValueError("owner_id is required")

        if self.period_end <= self.period_start:
            raise ValueError(
                "period_end must be later than period_start"
            )

        if not currency:
            raise ValueError("currency is required")

        non_negative_fields = (
            (
                "completed_booking_count",
                self.completed_booking_count,
            ),
            (
                "gross_revenue_minor",
                self.gross_revenue_minor,
            ),
            (
                "previous_gross_revenue_minor",
                self.previous_gross_revenue_minor,
            ),
            (
                "average_ticket_minor",
                self.average_ticket_minor,
            ),
        )

        for field_name, value in non_negative_fields:
            if isinstance(value, bool) or not isinstance(value, int):
                raise TypeError(f"{field_name} must be an integer")

            if value < 0:
                raise ValueError(
                    f"{field_name} cannot be negative"
                )

        object.__setattr__(self, "owner_id", owner_id)
        object.__setattr__(self, "currency", currency)


@runtime_checkable
class AnalyticsProvider(Protocol):
    """Infrastructure-neutral read contract for analytics facts."""

    def get_revenue_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> RevenueSnapshot | Awaitable[RevenueSnapshot]:
        ...
