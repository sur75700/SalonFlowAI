from dataclasses import dataclass

from app.intelligence.capacity import (
    CapacityProvider,
    CapacitySnapshot,
    calculate_capacity_utilization_percent,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import get_execution_snapshot
from app.intelligence.contracts import (
    Evidence,
    Signal,
    SignalSeverity,
)


CAPACITY_IDLE_MAX_PERCENT = 10.0
CAPACITY_UNDERUTILIZED_MAX_PERCENT = 49.99
CAPACITY_HEALTHY_MAX_PERCENT = 84.99
CAPACITY_NEAR_LIMIT_MAX_PERCENT = 100.0


def classify_capacity_utilization(
    utilization_percent: float,
) -> str:
    """Classify capacity utilization using deterministic thresholds."""

    if isinstance(utilization_percent, bool) or not isinstance(
        utilization_percent,
        (int, float),
    ):
        raise TypeError(
            "utilization_percent must be a number"
        )

    utilization = float(utilization_percent)

    if utilization < 0:
        raise ValueError(
            "utilization_percent cannot be negative"
        )

    if utilization <= CAPACITY_IDLE_MAX_PERCENT:
        return "capacity.idle"

    if utilization <= CAPACITY_UNDERUTILIZED_MAX_PERCENT:
        return "capacity.underutilized"

    if utilization <= CAPACITY_HEALTHY_MAX_PERCENT:
        return "capacity.healthy"

    if utilization <= CAPACITY_NEAR_LIMIT_MAX_PERCENT:
        return "capacity.near_limit"

    return "capacity.overloaded"


def _capacity_signal_details(
    *,
    code: str,
    utilization_percent: float,
    available_slots: int,
) -> tuple[str, str, SignalSeverity]:
    if code == "capacity.overloaded":
        return (
            "Capacity is overloaded",
            (
                "Booked demand exceeds configured capacity at "
                f"{utilization_percent:.2f}% utilization. "
                "Immediate schedule or staffing intervention is required."
            ),
            SignalSeverity.CRITICAL,
        )

    if code == "capacity.near_limit":
        return (
            "Capacity is near its limit",
            (
                "Capacity utilization reached "
                f"{utilization_percent:.2f}% with "
                f"{available_slots} open slots remaining."
            ),
            SignalSeverity.WARNING,
        )

    if code == "capacity.healthy":
        return (
            "Capacity utilization is healthy",
            (
                "Capacity utilization is balanced at "
                f"{utilization_percent:.2f}% with "
                f"{available_slots} open slots."
            ),
            SignalSeverity.INFO,
        )

    if code == "capacity.underutilized":
        return (
            "Capacity is underutilized",
            (
                "Capacity utilization is only "
                f"{utilization_percent:.2f}% and "
                f"{available_slots} slots remain available."
            ),
            SignalSeverity.OPPORTUNITY,
        )

    return (
        "Capacity is mostly idle",
        (
            "Capacity utilization is only "
            f"{utilization_percent:.2f}% and "
            f"{available_slots} slots remain available."
        ),
        SignalSeverity.WARNING,
    )


def build_capacity_signal(
    *,
    snapshot: CapacitySnapshot,
) -> Signal:
    """Build one evidence-backed capacity utilization signal."""

    if not isinstance(snapshot, CapacitySnapshot):
        raise TypeError(
            "snapshot must be a CapacitySnapshot"
        )

    utilization_percent = calculate_capacity_utilization_percent(
        booked_slots=snapshot.booked_slots,
        total_slots=snapshot.total_slots,
    )

    available_slots = max(
        snapshot.total_slots - snapshot.booked_slots,
        0,
    )

    code = classify_capacity_utilization(
        utilization_percent
    )

    title, description, severity = _capacity_signal_details(
        code=code,
        utilization_percent=utilization_percent,
        available_slots=available_slots,
    )

    evidence = (
        Evidence(
            source="capacity.snapshot",
            description=(
                "Booked slots compared with total configured slots"
            ),
            value={
                "booked_slots": snapshot.booked_slots,
                "total_slots": snapshot.total_slots,
                "available_slots": available_slots,
                "utilization_percent": utilization_percent,
                "active_staff_count": (
                    snapshot.active_staff_count
                ),
            },
            observed_at=snapshot.period_end,
        ),
    )

    return Signal(
        code=code,
        title=title,
        description=description,
        severity=severity,
        evidence=evidence,
    )


def build_capacity_signals(
    *,
    snapshot: CapacitySnapshot,
) -> tuple[Signal, ...]:
    """Return immutable capacity signals for a snapshot."""

    return (
        build_capacity_signal(snapshot=snapshot),
    )


@dataclass(frozen=True, slots=True)
class CapacitySignalBuilder:
    """Provider-backed callable compatible with SignalBuilder."""

    provider: CapacityProvider

    def __post_init__(self) -> None:
        if not isinstance(self.provider, CapacityProvider):
            raise TypeError(
                "provider must satisfy CapacityProvider"
            )

    def __call__(
        self,
        context: IntelligenceContext,
    ) -> tuple[Signal, ...]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        snapshot = get_execution_snapshot(
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

        return build_capacity_signals(snapshot=snapshot)
