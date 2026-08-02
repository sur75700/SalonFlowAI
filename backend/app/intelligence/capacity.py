from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol, runtime_checkable

from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import get_execution_snapshot
from app.intelligence.contracts import Metric


def _require_non_negative_integer(
    *,
    field_name: str,
    value: int,
) -> None:
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError(f"{field_name} must be an integer")

    if value < 0:
        raise ValueError(f"{field_name} cannot be negative")


def calculate_capacity_utilization_percent(
    *,
    booked_slots: int,
    total_slots: int,
) -> float:
    """Calculate deterministic booked-slot utilization."""

    _require_non_negative_integer(
        field_name="booked_slots",
        value=booked_slots,
    )
    _require_non_negative_integer(
        field_name="total_slots",
        value=total_slots,
    )

    if total_slots == 0:
        return 0.0

    return round((booked_slots / total_slots) * 100.0, 2)


def calculate_staff_load_percent(
    *,
    booked_minutes: int,
    available_minutes: int,
) -> float:
    """Calculate booked time as a percentage of staffed capacity."""

    _require_non_negative_integer(
        field_name="booked_minutes",
        value=booked_minutes,
    )
    _require_non_negative_integer(
        field_name="available_minutes",
        value=available_minutes,
    )

    if available_minutes == 0:
        return 0.0

    return round(
        (booked_minutes / available_minutes) * 100.0,
        2,
    )



class CapacityDataUnavailable(RuntimeError):
    """
    Raised when trustworthy staffed-capacity facts are unavailable.

    Capacity intelligence must fail closed instead of inventing
    total slots, staffed minutes or staff coverage.
    """


@dataclass(frozen=True, slots=True)
class CapacityBaseline:
    """
    Explicit staffed-capacity facts for one intelligence execution.

    This baseline must be supplied from a trusted configuration,
    schedule or availability source. It must never be inferred only
    from observed appointments.
    """

    owner_id: str
    period_start: datetime
    period_end: datetime
    total_slots: int
    active_staff_count: int
    available_minutes: int
    source: str

    def __post_init__(self) -> None:
        owner_id = self.owner_id.strip()
        source = self.source.strip()

        if not owner_id:
            raise ValueError(
                "capacity baseline owner_id is required"
            )

        if not source:
            raise ValueError(
                "capacity baseline source is required"
            )

        period_start = self.period_start
        period_end = self.period_end

        if period_start.tzinfo is None:
            period_start = period_start.replace(
                tzinfo=UTC
            )
        else:
            period_start = period_start.astimezone(
                UTC
            )

        if period_end.tzinfo is None:
            period_end = period_end.replace(
                tzinfo=UTC
            )
        else:
            period_end = period_end.astimezone(
                UTC
            )

        if period_end <= period_start:
            raise ValueError(
                "capacity baseline period_end must be "
                "later than period_start"
            )

        integer_fields = (
            ("total_slots", self.total_slots),
            (
                "active_staff_count",
                self.active_staff_count,
            ),
            (
                "available_minutes",
                self.available_minutes,
            ),
        )

        for field_name, value in integer_fields:
            _require_non_negative_integer(
                field_name=field_name,
                value=value,
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
        object.__setattr__(self, "source", source)


CAPACITY_BASELINE_METADATA_KEY = (
    "capacity_baseline"
)


def require_capacity_baseline(
    context: IntelligenceContext,
) -> CapacityBaseline:
    """
    Return a trusted capacity baseline or fail closed.

    Appointment history can prove demand and occupied time, but it
    cannot prove total staffed availability by itself.
    """

    if not isinstance(context, IntelligenceContext):
        raise TypeError(
            "context must be an IntelligenceContext"
        )

    baseline = context.metadata.get(
        CAPACITY_BASELINE_METADATA_KEY
    )

    if not isinstance(baseline, CapacityBaseline):
        raise CapacityDataUnavailable(
            "trusted capacity baseline is unavailable"
        )

    if baseline.owner_id != context.owner_id:
        raise RuntimeError(
            "capacity baseline owner does not match "
            "context owner"
        )

    return baseline


@dataclass(frozen=True, slots=True)
class CapacitySnapshot:
    """Read-only operational capacity facts."""

    owner_id: str
    period_start: datetime
    period_end: datetime
    total_slots: int
    booked_slots: int
    completed_booking_count: int
    active_staff_count: int
    available_minutes: int
    booked_minutes: int

    def __post_init__(self) -> None:
        owner_id = self.owner_id.strip()

        if not owner_id:
            raise ValueError("owner_id is required")

        if self.period_end <= self.period_start:
            raise ValueError(
                "period_end must be later than period_start"
            )

        integer_fields = (
            ("total_slots", self.total_slots),
            ("booked_slots", self.booked_slots),
            (
                "completed_booking_count",
                self.completed_booking_count,
            ),
            ("active_staff_count", self.active_staff_count),
            ("available_minutes", self.available_minutes),
            ("booked_minutes", self.booked_minutes),
        )

        for field_name, value in integer_fields:
            _require_non_negative_integer(
                field_name=field_name,
                value=value,
            )

        object.__setattr__(self, "owner_id", owner_id)


@runtime_checkable
class CapacityProvider(Protocol):
    """Infrastructure-neutral capacity analytics contract."""

    def get_capacity_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacitySnapshot | Awaitable[CapacitySnapshot]:
        ...


def build_capacity_metrics(
    *,
    snapshot: CapacitySnapshot,
) -> tuple[Metric, ...]:
    """Convert validated capacity facts into intelligence metrics."""

    utilization_percent = calculate_capacity_utilization_percent(
        booked_slots=snapshot.booked_slots,
        total_slots=snapshot.total_slots,
    )

    staff_load_percent = calculate_staff_load_percent(
        booked_minutes=snapshot.booked_minutes,
        available_minutes=snapshot.available_minutes,
    )

    available_slots = max(
        snapshot.total_slots - snapshot.booked_slots,
        0,
    )

    idle_minutes = max(
        snapshot.available_minutes - snapshot.booked_minutes,
        0,
    )

    return (
        Metric(
            key="capacity.utilization_percent",
            label="Capacity utilization",
            value=utilization_percent,
            unit="percent",
        ),
        Metric(
            key="capacity.available_slots",
            label="Available slots",
            value=available_slots,
            unit="slots",
        ),
        Metric(
            key="capacity.completed_bookings",
            label="Completed bookings",
            value=snapshot.completed_booking_count,
            unit="bookings",
        ),
        Metric(
            key="capacity.staff_load_percent",
            label="Staff load",
            value=staff_load_percent,
            unit="percent",
        ),
        Metric(
            key="capacity.idle_hours",
            label="Idle capacity",
            value=round(idle_minutes / 60.0, 2),
            unit="hours",
        ),
    )


@dataclass(frozen=True, slots=True)
class CapacityMetricBuilder:
    """Provider-backed callable compatible with MetricBuilder."""

    provider: CapacityProvider

    def __post_init__(self) -> None:
        if not isinstance(self.provider, CapacityProvider):
            raise TypeError(
                "provider must satisfy CapacityProvider"
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
            domain="capacity",
            provider=self.provider,
            loader=lambda: self.provider.get_capacity_snapshot(
                context=context
            ),
        )

        if not isinstance(snapshot, CapacitySnapshot):
            raise TypeError(
                "provider must return CapacitySnapshot"
            )

        if snapshot.owner_id != context.owner_id:
            raise RuntimeError(
                "capacity snapshot owner does not match context owner"
            )

        return build_capacity_metrics(snapshot=snapshot)
