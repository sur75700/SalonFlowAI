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


_REVENUE_RECOMMENDATION_CODES = {
    "revenue.growth": "revenue.scale_growth",
    "revenue.stable": "revenue.monitor_stability",
    "revenue.decline": "revenue.recover_decline",
    "revenue.critical_decline": "revenue.emergency_recovery",
}


def _metric_value(
    metrics: tuple[Metric, ...],
    key: str,
) -> float | None:
    for metric in metrics:
        if metric.key == key:
            return float(metric.value)

    return None


def build_revenue_recommendation(
    *,
    signal: Signal,
    metrics: tuple[Metric, ...],
) -> Recommendation | None:
    """Translate one supported revenue signal into an action."""

    if signal.code not in _REVENUE_RECOMMENDATION_CODES:
        return None

    growth = _metric_value(
        metrics,
        "revenue.growth_percent",
    )

    if signal.code == "revenue.critical_decline":
        return Recommendation(
            code="revenue.emergency_recovery",
            title="Start immediate revenue recovery",
            description=(
                "Review cancellations, inactive clients, "
                "staff utilization and underperforming services. "
                "Launch a focused recovery campaign immediately."
            ),
            priority=1,
            expected_impacts=(
                ExpectedImpact(
                    metric="revenue.growth_percent",
                    estimated_change=15.0,
                    unit="percentage_points",
                    timeframe_days=30,
                ),
            ),
        )

    if signal.code == "revenue.decline":
        return Recommendation(
            code="revenue.recover_decline",
            title="Activate client retention campaign",
            description=(
                "Re-engage inactive clients and promote "
                "high-demand services to reverse the decline."
            ),
            priority=2,
            expected_impacts=(
                ExpectedImpact(
                    metric="revenue.growth_percent",
                    estimated_change=10.0,
                    unit="percentage_points",
                    timeframe_days=30,
                ),
            ),
        )

    if signal.code == "revenue.growth":
        growth_description = (
            f" Current measured growth is {growth:.2f}%."
            if growth is not None
            else ""
        )

        return Recommendation(
            code="revenue.scale_growth",
            title="Scale successful revenue drivers",
            description=(
                "Identify the services, staff and booking periods "
                "driving growth, then increase their capacity and "
                "promotion without reducing service quality."
                + growth_description
            ),
            priority=3,
            expected_impacts=(
                ExpectedImpact(
                    metric="revenue.growth_percent",
                    estimated_change=5.0,
                    unit="percentage_points",
                    timeframe_days=30,
                ),
            ),
        )

    return Recommendation(
        code="revenue.monitor_stability",
        title="Protect stable revenue performance",
        description=(
            "Maintain current operations while monitoring pricing, "
            "booking volume and average ticket for early movement."
        ),
        priority=4,
        expected_impacts=(
            ExpectedImpact(
                metric="revenue.growth_percent",
                estimated_change=2.0,
                unit="percentage_points",
                timeframe_days=30,
            ),
        ),
    )


def build_revenue_recommendations(
    *,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
) -> tuple[Recommendation, ...]:
    recommendations = tuple(
        recommendation
        for signal in signals
        if (
            recommendation := build_revenue_recommendation(
                signal=signal,
                metrics=metrics,
            )
        )
        is not None
    )

    return prioritize_recommendations(recommendations)


@dataclass(frozen=True, slots=True)
class RevenueRecommendationBuilder:
    """Pipeline-compatible deterministic recommendation builder."""

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

        return build_revenue_recommendations(
            signals=signals,
            metrics=metrics,
        )
