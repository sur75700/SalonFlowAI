from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol, runtime_checkable

from app.intelligence.context import IntelligenceContext


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
class ServicePerformanceSnapshot:
    """
    Selected-currency performance facts for one service identity.

    catalog_present distinguishes current selected-currency catalog
    records from historical-only appointment-derived records.

    Monetary values use integer minor units. Appointment counts are
    partitioned into completed, scheduled, cancelled and other
    statuses for the exact selected analysis period.
    """

    service_id: str
    name: str
    catalog_present: bool
    is_active: bool

    duration_minutes: int
    configured_price_minor: int

    appointment_count: int
    completed_booking_count: int
    scheduled_booking_count: int
    cancelled_booking_count: int
    other_booking_count: int

    completed_revenue_minor: int
    scheduled_value_minor: int
    cancelled_value_minor: int

    def __post_init__(self) -> None:
        service_id = _required_text(
            field_name="service_id",
            value=self.service_id,
        )

        name = _required_text(
            field_name="name",
            value=self.name,
        )

        if not isinstance(self.catalog_present, bool):
            raise TypeError(
                "catalog_present must be a boolean"
            )

        if not isinstance(self.is_active, bool):
            raise TypeError("is_active must be a boolean")

        if not self.catalog_present and self.is_active:
            raise ValueError(
                "historical-only service cannot be active"
            )

        integer_fields = (
            ("duration_minutes", self.duration_minutes),
            (
                "configured_price_minor",
                self.configured_price_minor,
            ),
            ("appointment_count", self.appointment_count),
            (
                "completed_booking_count",
                self.completed_booking_count,
            ),
            (
                "scheduled_booking_count",
                self.scheduled_booking_count,
            ),
            (
                "cancelled_booking_count",
                self.cancelled_booking_count,
            ),
            (
                "other_booking_count",
                self.other_booking_count,
            ),
            (
                "completed_revenue_minor",
                self.completed_revenue_minor,
            ),
            (
                "scheduled_value_minor",
                self.scheduled_value_minor,
            ),
            (
                "cancelled_value_minor",
                self.cancelled_value_minor,
            ),
        )

        for field_name, value in integer_fields:
            _non_negative_integer(
                field_name=field_name,
                value=value,
            )

        if (
            self.catalog_present
            and self.duration_minutes == 0
        ):
            raise ValueError(
                "catalog-backed duration_minutes must be "
                "greater than zero"
            )

        partitioned_count = (
            self.completed_booking_count
            + self.scheduled_booking_count
            + self.cancelled_booking_count
            + self.other_booking_count
        )

        if partitioned_count != self.appointment_count:
            raise ValueError(
                "appointment_count must equal the sum of "
                "status-specific booking counts"
            )

        object.__setattr__(
            self,
            "service_id",
            service_id,
        )
        object.__setattr__(self, "name", name)

    @property
    def demand_booking_count(self) -> int:
        """Completed and scheduled demand excluding cancellations."""

        return (
            self.completed_booking_count
            + self.scheduled_booking_count
        )


@dataclass(frozen=True, slots=True)
class ServiceSnapshot:
    """
    Immutable selected-period, selected-currency service facts.

    The service tuple contains current catalog entries for the context
    currency plus historical-only entries reconstructed from immutable
    appointment snapshots when catalog identity or currency changed.

    Appointment values always use booking-time snapshots rather than
    current mutable catalog pricing.
    """

    owner_id: str
    period_start: datetime
    period_end: datetime
    currency: str

    total_service_count: int
    active_service_count: int

    services: tuple[ServicePerformanceSnapshot, ...]

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

        _non_negative_integer(
            field_name="total_service_count",
            value=self.total_service_count,
        )

        _non_negative_integer(
            field_name="active_service_count",
            value=self.active_service_count,
        )

        if not isinstance(self.services, tuple):
            raise TypeError("services must be a tuple")

        for item in self.services:
            if not isinstance(
                item,
                ServicePerformanceSnapshot,
            ):
                raise TypeError(
                    "services must contain "
                    "ServicePerformanceSnapshot values"
                )

        if len(self.services) != self.total_service_count:
            raise ValueError(
                "total_service_count must match "
                "the service collection size"
            )

        calculated_active_count = sum(
            1
            for item in self.services
            if item.is_active
        )

        if (
            calculated_active_count
            != self.active_service_count
        ):
            raise ValueError(
                "active_service_count must match "
                "active service records"
            )

        service_ids = tuple(
            item.service_id
            for item in self.services
        )

        if len(set(service_ids)) != len(service_ids):
            raise ValueError(
                "service identifiers must be unique"
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
class ServiceProvider(Protocol):
    """Infrastructure-neutral service intelligence provider."""

    def get_service_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> ServiceSnapshot | Awaitable[ServiceSnapshot]:
        ...
