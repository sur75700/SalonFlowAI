from dataclasses import dataclass

from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import get_execution_snapshot
from app.intelligence.contracts import Metric
from app.intelligence.provider import (
    AnalyticsProvider,
    RevenueSnapshot,
)


def calculate_revenue_growth_percent(
    *,
    current_revenue_minor: int,
    previous_revenue_minor: int,
) -> float:
    """Calculate deterministic period-over-period revenue growth."""

    values = (
        ("current_revenue_minor", current_revenue_minor),
        ("previous_revenue_minor", previous_revenue_minor),
    )

    for field_name, value in values:
        if isinstance(value, bool) or not isinstance(value, int):
            raise TypeError(f"{field_name} must be an integer")

        if value < 0:
            raise ValueError(f"{field_name} cannot be negative")

    if previous_revenue_minor == 0:
        if current_revenue_minor == 0:
            return 0.0

        return 100.0

    growth = (
        (
            current_revenue_minor
            - previous_revenue_minor
        )
        / previous_revenue_minor
    ) * 100.0

    return round(growth, 2)


def build_revenue_metrics(
    *,
    snapshot: RevenueSnapshot,
) -> tuple[Metric, ...]:
    """Convert validated revenue facts into intelligence metrics."""

    growth_percent = calculate_revenue_growth_percent(
        current_revenue_minor=snapshot.gross_revenue_minor,
        previous_revenue_minor=(
            snapshot.previous_gross_revenue_minor
        ),
    )

    return (
        Metric(
            key="revenue.current",
            label="Current period revenue",
            value=snapshot.gross_revenue_minor,
            unit=snapshot.currency,
        ),
        Metric(
            key="revenue.previous",
            label="Previous period revenue",
            value=snapshot.previous_gross_revenue_minor,
            unit=snapshot.currency,
        ),
        Metric(
            key="revenue.growth_percent",
            label="Revenue growth",
            value=growth_percent,
            unit="percent",
        ),
        Metric(
            key="revenue.completed_bookings",
            label="Completed bookings",
            value=snapshot.completed_booking_count,
            unit="bookings",
        ),
        Metric(
            key="revenue.average_ticket",
            label="Average ticket",
            value=snapshot.average_ticket_minor,
            unit=snapshot.currency,
        ),
    )


@dataclass(frozen=True, slots=True)
class RevenueMetricBuilder:
    """Provider-backed callable compatible with MetricBuilder."""

    provider: AnalyticsProvider

    def __post_init__(self) -> None:
        if not isinstance(self.provider, AnalyticsProvider):
            raise TypeError(
                "provider must satisfy AnalyticsProvider"
            )

    def __call__(
        self,
        context: IntelligenceContext,
    ) -> tuple[Metric, ...]:
        snapshot = get_execution_snapshot(
            context=context,
            domain="revenue",
            provider=self.provider,
            loader=lambda: self.provider.get_revenue_snapshot(
                context=context
            ),
        )

        if snapshot.owner_id != context.owner_id:
            raise RuntimeError(
                "revenue snapshot owner does not match context owner"
            )

        return build_revenue_metrics(snapshot=snapshot)
