import unittest
from datetime import UTC, datetime

from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.capacity import CapacitySnapshot
from app.intelligence.client_intelligence import (
    ClientSnapshot,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.factory import (
    create_intelligence_service,
)
from app.intelligence.provider import RevenueSnapshot
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.provider_family_metrics import (
    ProviderFamilyMetricBuilder,
)
from app.intelligence.provider_family_recommendations import (
    ProviderFamilyRecommendationBuilder,
)
from app.intelligence.provider_family_signals import (
    ProviderFamilySignalBuilder,
)
from app.intelligence.service_intelligence import (
    ServicePerformanceSnapshot,
    ServiceSnapshot,
)


START = datetime(2026, 7, 1, tzinfo=UTC)
END = datetime(2026, 7, 8, tzinfo=UTC)


class CountingRevenueProvider:
    def __init__(self):
        self.calls = 0

    def get_revenue_snapshot(
        self,
        *,
        context,
    ):
        self.calls += 1

        return RevenueSnapshot(
            owner_id="tenant-a",
            period_start=START,
            period_end=END,
            currency="USD",
            completed_booking_count=4,
            gross_revenue_minor=20_000,
            previous_gross_revenue_minor=10_000,
            average_ticket_minor=5_000,
        )


class CountingCapacityProvider:
    def __init__(self):
        self.calls = 0

    def get_capacity_snapshot(
        self,
        *,
        context,
    ):
        self.calls += 1

        return CapacitySnapshot(
            owner_id="tenant-a",
            period_start=START,
            period_end=END,
            total_slots=10,
            booked_slots=4,
            completed_booking_count=3,
            active_staff_count=2,
            available_minutes=600,
            booked_minutes=240,
        )


class CountingClientProvider:
    def __init__(self):
        self.calls = 0

    def get_client_snapshot(
        self,
        *,
        context,
    ):
        self.calls += 1

        return ClientSnapshot(
            owner_id="tenant-a",
            period_start=START,
            period_end=END,
            currency="USD",
            total_client_count=10,
            new_client_count=2,
            active_client_count=4,
            returning_client_count=2,
            historically_active_client_count=6,
            at_risk_client_count=2,
            high_value_client_count=1,
            completed_booking_count=5,
            completed_revenue_minor=20_000,
        )


class CountingServiceProvider:
    def __init__(self):
        self.calls = 0

    def get_service_snapshot(
        self,
        *,
        context,
    ):
        self.calls += 1

        return ServiceSnapshot(
            owner_id="tenant-a",
            period_start=START,
            period_end=END,
            currency="USD",
            total_service_count=1,
            active_service_count=1,
            services=(
                ServicePerformanceSnapshot(
                    service_id="service-a",
                    name="Haircut",
                    catalog_present=True,
                    is_active=True,
                    duration_minutes=60,
                    configured_price_minor=5_000,
                    appointment_count=4,
                    completed_booking_count=3,
                    scheduled_booking_count=1,
                    cancelled_booking_count=0,
                    other_booking_count=0,
                    completed_revenue_minor=15_000,
                    scheduled_value_minor=5_000,
                    cancelled_value_minor=0,
                ),
            ),
        )


def make_family():
    return IntelligenceProviderFamily(
        revenue=CountingRevenueProvider(),
        capacity=CountingCapacityProvider(),
        client=CountingClientProvider(),
        service=CountingServiceProvider(),
    )


def build_summary(
    context,
    signals,
    metrics,
):
    return (
        f"{len(signals)} trusted signals "
        f"across {len(metrics)} metrics."
    )


def build_pipeline_confidence(
    context,
    signals,
    metrics,
    recommendations,
):
    return (
        1.0,
        "All configured provider-family domains "
        "returned validated snapshots.",
    )


def make_runtime():
    family = make_family()

    builders = IntelligenceBuilders(
        signal_builder=ProviderFamilySignalBuilder(
            providers=family
        ),
        metric_builder=ProviderFamilyMetricBuilder(
            providers=family
        ),
        recommendation_builder=(
            ProviderFamilyRecommendationBuilder()
        ),
        summary_builder=build_summary,
        confidence_builder=(
            build_pipeline_confidence
        ),
    )

    service = create_intelligence_service(
        builders=builders
    )

    return family, service


class ProviderFamilyPipelineTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_reuses_snapshots_across_stages(
        self,
    ):
        family, service = make_runtime()

        await service.analyze(
            context=IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        self.assertEqual(family.revenue.calls, 1)
        self.assertEqual(family.capacity.calls, 1)
        self.assertEqual(family.client.calls, 1)
        self.assertEqual(family.service.calls, 1)

    async def test_builds_complete_decision_surface(
        self,
    ):
        _, service = make_runtime()

        decision = await service.analyze(
            context=IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        self.assertEqual(
            tuple(
                signal.code
                for signal in decision.signals
            ),
            (
                "capacity.underutilized",
                "revenue.growth",
            ),
        )

        self.assertEqual(len(decision.metrics), 29)

        metric_keys = {
            metric.key
            for metric in decision.metrics
        }

        self.assertIn(
            "client.at_risk_count",
            metric_keys,
        )
        self.assertIn(
            "service.scheduled_value_minor",
            metric_keys,
        )

        self.assertEqual(
            tuple(
                recommendation.code
                for recommendation
                in decision.recommendations
            ),
            (
                "capacity.promote_open_slots",
                "revenue.scale_growth",
            ),
        )

        self.assertEqual(
            decision.summary,
            "2 trusted signals across 29 metrics.",
        )
        self.assertEqual(
            decision.confidence.score,
            1.0,
        )

    async def test_cache_isolated_per_analysis(
        self,
    ):
        family, service = make_runtime()

        context = IntelligenceContext(
            owner_id="tenant-a",
            currency="USD",
        )

        await service.analyze(context=context)
        await service.analyze(context=context)

        self.assertEqual(family.revenue.calls, 2)
        self.assertEqual(family.capacity.calls, 2)
        self.assertEqual(family.client.calls, 2)
        self.assertEqual(family.service.calls, 2)


if __name__ == "__main__":
    unittest.main()
