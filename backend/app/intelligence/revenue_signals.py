from dataclasses import dataclass

from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import get_execution_snapshot
from app.intelligence.contracts import (
    Evidence,
    Signal,
    SignalSeverity,
)
from app.intelligence.provider import (
    AnalyticsProvider,
    RevenueSnapshot,
)
from app.intelligence.revenue import (
    calculate_revenue_growth_percent,
)


REVENUE_GROWTH_OPPORTUNITY_PERCENT = 10.0
REVENUE_DECLINE_WARNING_PERCENT = -10.0
REVENUE_DECLINE_CRITICAL_PERCENT = -25.0


def classify_revenue_growth(
    growth_percent: float,
) -> SignalSeverity:
    """Classify period-over-period revenue movement."""

    if isinstance(growth_percent, bool) or not isinstance(
        growth_percent,
        (int, float),
    ):
        raise TypeError(
            "growth_percent must be a number"
        )

    growth = float(growth_percent)

    if growth <= REVENUE_DECLINE_CRITICAL_PERCENT:
        return SignalSeverity.CRITICAL

    if growth <= REVENUE_DECLINE_WARNING_PERCENT:
        return SignalSeverity.WARNING

    if growth >= REVENUE_GROWTH_OPPORTUNITY_PERCENT:
        return SignalSeverity.OPPORTUNITY

    return SignalSeverity.INFO


def build_revenue_signal(
    *,
    snapshot: RevenueSnapshot,
) -> Signal:
    """Build one deterministic signal from a revenue snapshot."""

    growth_percent = calculate_revenue_growth_percent(
        current_revenue_minor=snapshot.gross_revenue_minor,
        previous_revenue_minor=(
            snapshot.previous_gross_revenue_minor
        ),
    )

    severity = classify_revenue_growth(growth_percent)

    evidence = (
        Evidence(
            source="revenue_snapshot",
            description=(
                "Current period revenue compared with "
                "the previous period"
            ),
            value={
                "growth_percent": growth_percent,
                "current_revenue_minor": (
                    snapshot.gross_revenue_minor
                ),
                "previous_revenue_minor": (
                    snapshot.previous_gross_revenue_minor
                ),
                "currency": snapshot.currency,
            },
            observed_at=snapshot.period_end,
        ),
    )

    if severity is SignalSeverity.CRITICAL:
        return Signal(
            code="revenue.critical_decline",
            title="Critical revenue decline",
            description=(
                f"Revenue declined by "
                f"{abs(growth_percent):.2f}% "
                "compared with the previous period."
            ),
            severity=severity,
            evidence=evidence,
        )

    if severity is SignalSeverity.WARNING:
        return Signal(
            code="revenue.decline",
            title="Revenue decline",
            description=(
                f"Revenue declined by "
                f"{abs(growth_percent):.2f}% "
                "compared with the previous period."
            ),
            severity=severity,
            evidence=evidence,
        )

    if severity is SignalSeverity.OPPORTUNITY:
        return Signal(
            code="revenue.growth",
            title="Revenue growth opportunity",
            description=(
                f"Revenue increased by "
                f"{growth_percent:.2f}% "
                "compared with the previous period."
            ),
            severity=severity,
            evidence=evidence,
        )

    return Signal(
        code="revenue.stable",
        title="Revenue is stable",
        description=(
            f"Revenue changed by {growth_percent:.2f}% "
            "compared with the previous period."
        ),
        severity=severity,
        evidence=evidence,
    )


def build_revenue_signals(
    *,
    snapshot: RevenueSnapshot,
) -> tuple[Signal, ...]:
    """Return the revenue signal collection for a snapshot."""

    return (build_revenue_signal(snapshot=snapshot),)


@dataclass(frozen=True, slots=True)
class RevenueSignalBuilder:
    """Provider-backed callable compatible with SignalBuilder."""

    provider: AnalyticsProvider

    def __post_init__(self) -> None:
        if not isinstance(self.provider, AnalyticsProvider):
            raise TypeError(
                "provider must satisfy AnalyticsProvider"
            )

    def __call__(
        self,
        context: IntelligenceContext,
    ) -> tuple[Signal, ...]:
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

        return build_revenue_signals(snapshot=snapshot)
