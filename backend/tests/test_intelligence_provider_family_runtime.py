import unittest
from datetime import UTC, datetime

from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.capacity import CapacitySnapshot
from app.intelligence.client_intelligence import (
    ClientSnapshot,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)
from app.intelligence.factory import (
    create_provider_family_intelligence_service,
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
from app.intelligence.provider_family_runtime import (
    ProviderFamilyConfidenceBuilder,
    ProviderFamilySummaryBuilder,
    create_provider_family_builders,
)
from app.intelligence.provider_family_signals import (
    ProviderFamilySignalBuilder,
)
from app.intelligence.service import IntelligenceService
from app.intelligence.service_intelligence import (
    ServicePerformanceSnapshot,
    ServiceSnapshot,
)


START = datetime(2026, 7, 1, tzinfo=UTC)
END = datetime(2026, 7, 8, tzinfo=UTC)


def metric(
    key: str,
    value: float = 1.0,
) -> Metric:
    return Metric(
        key=key,
        label=key,
        value=value,
        unit="count",
    )


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


class ProviderFamilyRuntimeTests(
    unittest.IsolatedAsyncioTestCase
):
    def test_summary_reports_validated_domains(self):
        summary = ProviderFamilySummaryBuilder()(
            IntelligenceContext(
                owner_id="tenant-a"
            ),
            (
                Signal(
                    code="revenue.growth",
                    title="Growth",
                    description="Growth",
                    severity=SignalSeverity.OPPORTUNITY,
                ),
            ),
            (
                metric("revenue.current"),
                metric("capacity.available_slots"),
                metric("client.total_count"),
                metric("service.total_count"),
            ),
        )

        self.assertEqual(
            summary,
            (
                "Analyzed 1 trusted signals and "
                "4 validated metrics across "
                "4 trusted domains: revenue, "
                "capacity, client, service."
            ),
        )

    def test_confidence_scores_full_coverage(self):
        score, explanation = (
            ProviderFamilyConfidenceBuilder()(
                IntelligenceContext(
                    owner_id="tenant-a"
                ),
                (),
                (
                    metric("revenue.current"),
                    metric(
                        "capacity.utilization_percent"
                    ),
                    metric("client.total_count"),
                    metric("service.total_count"),
                ),
                (),
            )
        )

        self.assertEqual(score, 1.0)
        self.assertIn(
            "4 of 4 trusted domains",
            explanation,
        )
        self.assertIn(
            "not predictive certainty",
            explanation,
        )

    def test_confidence_scores_partial_coverage(self):
        score, explanation = (
            ProviderFamilyConfidenceBuilder()(
                IntelligenceContext(
                    owner_id="tenant-a"
                ),
                (),
                (
                    metric("revenue.current"),
                    metric("client.total_count"),
                ),
                (),
            )
        )

        self.assertEqual(score, 0.5)
        self.assertIn(
            "2 of 4 trusted domains",
            explanation,
        )

    def test_create_builders_wires_complete_bundle(
        self,
    ):
        builders = create_provider_family_builders(
            providers=make_family()
        )

        self.assertIsInstance(
            builders,
            IntelligenceBuilders,
        )
        self.assertIsInstance(
            builders.signal_builder,
            ProviderFamilySignalBuilder,
        )
        self.assertIsInstance(
            builders.metric_builder,
            ProviderFamilyMetricBuilder,
        )
        self.assertIsInstance(
            builders.recommendation_builder,
            ProviderFamilyRecommendationBuilder,
        )
        self.assertIsInstance(
            builders.summary_builder,
            ProviderFamilySummaryBuilder,
        )
        self.assertIsInstance(
            builders.confidence_builder,
            ProviderFamilyConfidenceBuilder,
        )

    def test_create_builders_rejects_invalid_family(
        self,
    ):
        with self.assertRaisesRegex(
            TypeError,
            "providers must be an "
            "IntelligenceProviderFamily",
        ):
            create_provider_family_builders(
                providers=object()
            )

    async def test_factory_builds_complete_decision(
        self,
    ):
        family = make_family()

        service = (
            create_provider_family_intelligence_service(
                providers=family
            )
        )

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

        self.assertEqual(
            len(decision.metrics),
            29,
        )

        self.assertEqual(
            tuple(
                item.code
                for item
                in decision.recommendations
            ),
            (
                "capacity.promote_open_slots",
                "revenue.scale_growth",
            ),
        )

        self.assertEqual(
            decision.summary,
            (
                "Analyzed 2 trusted signals and "
                "29 validated metrics across "
                "4 trusted domains: revenue, "
                "capacity, client, service."
            ),
        )

        self.assertEqual(
            decision.confidence.score,
            1.0,
        )

        self.assertEqual(family.revenue.calls, 1)
        self.assertEqual(family.capacity.calls, 1)
        self.assertEqual(family.client.calls, 1)
        self.assertEqual(family.service.calls, 1)

    def test_default_factory_constructs_without_db_io(
        self,
    ):
        service = (
            create_provider_family_intelligence_service()
        )

        self.assertIsInstance(
            service,
            IntelligenceService,
        )


if __name__ == "__main__":
    unittest.main()
