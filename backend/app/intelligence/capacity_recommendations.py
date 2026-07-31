from dataclasses import dataclass

from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    ExpectedImpact,
    Metric,
    Recommendation,
    Signal,
)
from app.intelligence.recommendations import (
    prioritize_recommendations,
)


_RECOMMENDATION_CODES = {
    "capacity.overloaded": "capacity.expand_capacity",
    "capacity.near_limit": "capacity.prepare_capacity",
    "capacity.healthy": "capacity.monitor_balance",
    "capacity.underutilized": "capacity.promote_open_slots",
    "capacity.idle": "capacity.recover_idle_capacity",
}


def _recommendation_for_signal(
    signal: Signal,
) -> Recommendation | None:
    recommendation_code = _RECOMMENDATION_CODES.get(
        signal.code
    )

    if recommendation_code is None:
        return None

    if signal.code == "capacity.overloaded":
        return Recommendation(
            code=recommendation_code,
            title="Expand or rebalance capacity",
            description=(
                "Add staffed appointment capacity, rebalance demand "
                "across available team members, and protect service "
                "quality from sustained overload."
            ),
            priority=1,
            expected_impacts=(
                ExpectedImpact(
                    metric="capacity.utilization_percent",
                    estimated_change=-15.0,
                    unit="percentage_points",
                    timeframe_days=14,
                ),
            ),
        )

    if signal.code == "capacity.near_limit":
        return Recommendation(
            code=recommendation_code,
            title="Prepare additional appointment capacity",
            description=(
                "Open additional high-demand slots or adjust staff "
                "coverage before utilization becomes overloaded."
            ),
            priority=2,
            expected_impacts=(
                ExpectedImpact(
                    metric="capacity.utilization_percent",
                    estimated_change=-5.0,
                    unit="percentage_points",
                    timeframe_days=14,
                ),
            ),
        )

    if signal.code == "capacity.underutilized":
        return Recommendation(
            code=recommendation_code,
            title="Promote available appointment slots",
            description=(
                "Target open periods with client reactivation, "
                "service campaigns, and schedule-aware promotions."
            ),
            priority=3,
            expected_impacts=(
                ExpectedImpact(
                    metric="capacity.utilization_percent",
                    estimated_change=10.0,
                    unit="percentage_points",
                    timeframe_days=30,
                ),
            ),
        )

    if signal.code == "capacity.idle":
        return Recommendation(
            code=recommendation_code,
            title="Recover idle capacity",
            description=(
                "Consolidate low-demand working periods and launch "
                "focused demand-generation actions for idle slots."
            ),
            priority=2,
            expected_impacts=(
                ExpectedImpact(
                    metric="capacity.utilization_percent",
                    estimated_change=20.0,
                    unit="percentage_points",
                    timeframe_days=30,
                ),
            ),
        )

    return Recommendation(
        code=recommendation_code,
        title="Maintain balanced capacity",
        description=(
            "Continue monitoring demand, staffed availability, "
            "and open slots while preserving the current balance."
        ),
        priority=4,
        expected_impacts=(
            ExpectedImpact(
                metric="capacity.utilization_percent",
                estimated_change=0.0,
                unit="percentage_points",
                timeframe_days=30,
            ),
        ),
    )


def build_capacity_recommendation(
    *,
    signal: Signal,
    metrics: tuple[Metric, ...],
) -> Recommendation | None:
    """Map a known capacity signal to one recommendation."""

    if not isinstance(signal, Signal):
        raise TypeError("signal must be a Signal")

    if not isinstance(metrics, tuple):
        raise TypeError("metrics must be a tuple")

    for metric in metrics:
        if not isinstance(metric, Metric):
            raise TypeError(
                "metrics must contain only Metric values"
            )

    return _recommendation_for_signal(signal)


def build_capacity_recommendations(
    *,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
) -> tuple[Recommendation, ...]:
    """Build and prioritize immutable capacity recommendations."""

    if not isinstance(signals, tuple):
        raise TypeError("signals must be a tuple")

    if not isinstance(metrics, tuple):
        raise TypeError("metrics must be a tuple")

    recommendations: list[Recommendation] = []

    for signal in signals:
        if not isinstance(signal, Signal):
            raise TypeError(
                "signals must contain only Signal values"
            )

        recommendation = build_capacity_recommendation(
            signal=signal,
            metrics=metrics,
        )

        if recommendation is not None:
            recommendations.append(recommendation)

    return prioritize_recommendations(
        tuple(recommendations)
    )


@dataclass(frozen=True, slots=True)
class CapacityRecommendationBuilder:
    """Callable compatible with RecommendationBuilder."""

    def __call__(
        self,
        context: IntelligenceContext,
        signals: tuple[Signal, ...],
        metrics: tuple[Metric, ...],
    ) -> tuple[Recommendation, ...]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        return build_capacity_recommendations(
            signals=signals,
            metrics=metrics,
        )
