from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol, runtime_checkable

from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import Metric
from app.intelligence.execution import get_execution_snapshot


def _required_text(
    *,
    field_name: str,
    value: str,
) -> str:
    if not isinstance(value, str):
        raise TypeError(f"{field_name} must be a string")

    normalized = value.strip()

    if not normalized:
        raise ValueError(f"{field_name} is required")

    return normalized


def _utc_datetime(
    *,
    field_name: str,
    value: datetime,
) -> datetime:
    if not isinstance(value, datetime):
        raise TypeError(f"{field_name} must be a datetime")

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _non_negative_integer(
    *,
    field_name: str,
    value: int,
) -> None:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field_name} must be an integer")

    if value < 0:
        raise ValueError(f"{field_name} cannot be negative")


@dataclass(frozen=True, slots=True)
class ClientSnapshot:
    """
    Immutable selected-period client intelligence facts.

    Definitions:

    active_client_count:
        Distinct clients with at least one completed booking during
        the selected period.

    returning_client_count:
        Distinct active clients with at least two completed bookings
        during the selected period.

    historically_active_client_count:
        Registered clients with completed activity before the
        selected period.

    at_risk_client_count:
        Historically active clients without a completed booking
        during the selected period.

    high_value_client_count:
        Active clients meeting the provider's documented
        selected-period value threshold.
    """

    owner_id: str
    period_start: datetime
    period_end: datetime
    currency: str

    total_client_count: int
    new_client_count: int
    active_client_count: int
    returning_client_count: int
    historically_active_client_count: int
    at_risk_client_count: int
    high_value_client_count: int

    completed_booking_count: int
    completed_revenue_minor: int

    def __post_init__(self) -> None:
        owner_id = _required_text(
            field_name="owner_id",
            value=self.owner_id,
        )

        currency = _required_text(
            field_name="currency",
            value=self.currency,
        ).upper()

        period_start = _utc_datetime(
            field_name="period_start",
            value=self.period_start,
        )

        period_end = _utc_datetime(
            field_name="period_end",
            value=self.period_end,
        )

        if period_end <= period_start:
            raise ValueError(
                "period_end must be later than period_start"
            )

        integer_fields = (
            ("total_client_count", self.total_client_count),
            ("new_client_count", self.new_client_count),
            ("active_client_count", self.active_client_count),
            (
                "returning_client_count",
                self.returning_client_count,
            ),
            (
                "historically_active_client_count",
                self.historically_active_client_count,
            ),
            (
                "at_risk_client_count",
                self.at_risk_client_count,
            ),
            (
                "high_value_client_count",
                self.high_value_client_count,
            ),
            (
                "completed_booking_count",
                self.completed_booking_count,
            ),
            (
                "completed_revenue_minor",
                self.completed_revenue_minor,
            ),
        )

        for field_name, value in integer_fields:
            _non_negative_integer(
                field_name=field_name,
                value=value,
            )

        if self.new_client_count > self.total_client_count:
            raise ValueError(
                "new_client_count cannot exceed "
                "total_client_count"
            )

        if self.active_client_count > self.total_client_count:
            raise ValueError(
                "active_client_count cannot exceed "
                "total_client_count"
            )

        if (
            self.returning_client_count
            > self.active_client_count
        ):
            raise ValueError(
                "returning_client_count cannot exceed "
                "active_client_count"
            )

        if (
            self.historically_active_client_count
            > self.total_client_count
        ):
            raise ValueError(
                "historically_active_client_count cannot exceed "
                "total_client_count"
            )

        if (
            self.at_risk_client_count
            > self.historically_active_client_count
        ):
            raise ValueError(
                "at_risk_client_count cannot exceed "
                "historically_active_client_count"
            )

        if (
            self.high_value_client_count
            > self.active_client_count
        ):
            raise ValueError(
                "high_value_client_count cannot exceed "
                "active_client_count"
            )

        if (
            self.active_client_count
            > self.completed_booking_count
        ):
            raise ValueError(
                "active_client_count cannot exceed "
                "completed_booking_count"
            )

        object.__setattr__(self, "owner_id", owner_id)
        object.__setattr__(
            self,
            "period_start",
            period_start,
        )
        object.__setattr__(
            self,
            "period_end",
            period_end,
        )
        object.__setattr__(self, "currency", currency)


@runtime_checkable
class ClientProvider(Protocol):
    """Infrastructure-neutral client intelligence provider."""

    def get_client_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> ClientSnapshot | Awaitable[ClientSnapshot]:
        ...

def build_client_metrics(
    *,
    snapshot: ClientSnapshot,
) -> tuple[Metric, ...]:
    """Convert trusted client facts into pipeline metrics."""

    if not isinstance(snapshot, ClientSnapshot):
        raise TypeError(
            "snapshot must be a ClientSnapshot"
        )

    return (
        Metric(
            key="client.total_count",
            label="Total clients",
            value=snapshot.total_client_count,
            unit="clients",
        ),
        Metric(
            key="client.new_count",
            label="New clients",
            value=snapshot.new_client_count,
            unit="clients",
        ),
        Metric(
            key="client.active_count",
            label="Active clients",
            value=snapshot.active_client_count,
            unit="clients",
        ),
        Metric(
            key="client.returning_count",
            label="Returning clients",
            value=snapshot.returning_client_count,
            unit="clients",
        ),
        Metric(
            key="client.historically_active_count",
            label="Historically active clients",
            value=(
                snapshot.historically_active_client_count
            ),
            unit="clients",
        ),
        Metric(
            key="client.at_risk_count",
            label="At-risk clients",
            value=snapshot.at_risk_client_count,
            unit="clients",
        ),
        Metric(
            key="client.high_value_count",
            label="High-value clients",
            value=snapshot.high_value_client_count,
            unit="clients",
        ),
        Metric(
            key="client.completed_bookings",
            label="Client completed bookings",
            value=snapshot.completed_booking_count,
            unit="bookings",
        ),
        Metric(
            key="client.completed_revenue_minor",
            label="Client completed revenue",
            value=snapshot.completed_revenue_minor,
            unit="minor_units",
        ),
    )


@dataclass(frozen=True, slots=True)
class ClientMetricBuilder:
    """Provider-backed client metric builder."""

    provider: ClientProvider

    def __post_init__(self) -> None:
        if not isinstance(self.provider, ClientProvider):
            raise TypeError(
                "provider must satisfy ClientProvider"
            )

    async def __call__(
        self,
        context: IntelligenceContext,
    ) -> tuple[Metric, ...]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        snapshot = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=self.provider,
            loader=lambda: self.provider.get_client_snapshot(
                context=context
            ),
        )

        if not isinstance(snapshot, ClientSnapshot):
            raise TypeError(
                "provider must return ClientSnapshot"
            )

        return build_client_metrics(
            snapshot=snapshot
        )
