from dataclasses import dataclass

from app.intelligence.capacity_recommendations import (
    CapacityRecommendationBuilder,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Metric,
    Recommendation,
    Signal,
)
from app.intelligence.recommendations import (
    prioritize_recommendations,
)
from app.intelligence.revenue_recommendations import (
    RevenueRecommendationBuilder,
)


@dataclass(frozen=True, slots=True)
class ProviderFamilyRecommendationBuilder:
    """
    Compose approved Revenue and Capacity recommendation policies.

    Unsupported Client or Service signal codes are ignored until their
    domain policies are explicitly specified and tested.
    """

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

        if not isinstance(signals, tuple):
            raise TypeError("signals must be a tuple")

        if not isinstance(metrics, tuple):
            raise TypeError("metrics must be a tuple")

        for signal in signals:
            if not isinstance(signal, Signal):
                raise TypeError(
                    "signals must contain only Signal values"
                )

        for metric in metrics:
            if not isinstance(metric, Metric):
                raise TypeError(
                    "metrics must contain only Metric values"
                )

        revenue_recommendations = (
            RevenueRecommendationBuilder()(
                context,
                signals,
                metrics,
            )
        )

        capacity_recommendations = (
            CapacityRecommendationBuilder()(
                context,
                signals,
                metrics,
            )
        )

        return prioritize_recommendations(
            revenue_recommendations
            + capacity_recommendations
        )
