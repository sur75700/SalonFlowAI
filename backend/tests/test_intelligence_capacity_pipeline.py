import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.capacity import (
    CapacityMetricBuilder,
    CapacitySnapshot,
)
from app.intelligence.capacity_recommendations import (
    CapacityRecommendationBuilder,
)
from app.intelligence.capacity_signals import (
    CapacitySignalBuilder,
)
from app.intelligence.context import IntelligenceContext


class CountingCapacityProvider:
    def __init__(self) -> None:
        self.calls = 0

    def get_capacity_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacitySnapshot:
        self.calls += 1
        start = datetime(2026, 7, 1, tzinfo=UTC)

        return CapacitySnapshot(
            owner_id=context.owner_id,
            period_start=start,
            period_end=start + timedelta(days=7),
            total_slots=100,
            booked_slots=95,
            completed_booking_count=84,
            active_staff_count=5,
            available_minutes=30_000,
            booked_minutes=28_500,
        )


class CapacityPipelineTests(unittest.IsolatedAsyncioTestCase):
    async def test_complete_capacity_decision(self) -> None:
        provider = CountingCapacityProvider()

        builders = IntelligenceBuilders(
            signal_builder=CapacitySignalBuilder(
                provider=provider
            ),
            metric_builder=CapacityMetricBuilder(
                provider=provider
            ),
            recommendation_builder=(
                CapacityRecommendationBuilder()
            ),
            summary_builder=(
                lambda context, signals, metrics: (
                    "Capacity intelligence generated"
                )
            ),
            confidence_builder=(
                lambda context, signals, metrics, recommendations: (
                    0.94,
                    "Capacity evidence validated",
                )
            ),
        )

        decision = await builders.create_pipeline().run(
            context=IntelligenceContext(
                owner_id="tenant-a"
            )
        )

        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(len(decision.metrics), 5)
        self.assertEqual(len(decision.signals), 1)
        self.assertEqual(
            decision.signals[0].code,
            "capacity.near_limit",
        )
        self.assertEqual(
            len(decision.recommendations),
            1,
        )
        self.assertEqual(
            decision.recommendations[0].code,
            "capacity.prepare_capacity",
        )
        self.assertEqual(provider.calls, 1)

    async def test_pipeline_preserves_tenant_boundary(self) -> None:
        provider = CountingCapacityProvider()

        builders = IntelligenceBuilders(
            signal_builder=CapacitySignalBuilder(
                provider=provider
            ),
            metric_builder=CapacityMetricBuilder(
                provider=provider
            ),
            recommendation_builder=(
                CapacityRecommendationBuilder()
            ),
            summary_builder=(
                lambda context, signals, metrics: (
                    f"Capacity intelligence for {context.owner_id}"
                )
            ),
            confidence_builder=(
                lambda context, signals, metrics, recommendations: (
                    0.90,
                    "Tenant-scoped capacity evidence",
                )
            ),
        )

        decision = await builders.create_pipeline().run(
            context=IntelligenceContext(
                owner_id="tenant-cosmos"
            )
        )

        self.assertEqual(
            decision.owner_id,
            "tenant-cosmos",
        )
        self.assertIn(
            "tenant-cosmos",
            decision.summary,
        )


if __name__ == "__main__":
    unittest.main()
