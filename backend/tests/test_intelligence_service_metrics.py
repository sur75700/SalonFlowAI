import unittest
from datetime import UTC, datetime

from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
)
from app.intelligence.service_intelligence import (
    ServiceMetricBuilder,
    ServicePerformanceSnapshot,
    ServiceSnapshot,
    build_service_metrics,
)


START = datetime(2026, 7, 1, tzinfo=UTC)
END = datetime(2026, 7, 8, tzinfo=UTC)


def make_snapshot() -> ServiceSnapshot:
    return ServiceSnapshot(
        owner_id="tenant-a",
        period_start=START,
        period_end=END,
        currency="USD",
        total_service_count=2,
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
                completed_booking_count=2,
                scheduled_booking_count=1,
                cancelled_booking_count=1,
                other_booking_count=0,
                completed_revenue_minor=10_000,
                scheduled_value_minor=5_000,
                cancelled_value_minor=5_000,
            ),
            ServicePerformanceSnapshot(
                service_id="legacy-service",
                name="Legacy Service",
                catalog_present=False,
                is_active=False,
                duration_minutes=0,
                configured_price_minor=0,
                appointment_count=2,
                completed_booking_count=1,
                scheduled_booking_count=0,
                cancelled_booking_count=0,
                other_booking_count=1,
                completed_revenue_minor=3_000,
                scheduled_value_minor=0,
                cancelled_value_minor=0,
            ),
        ),
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
        return make_snapshot()


class ServiceMetricTests(
    unittest.IsolatedAsyncioTestCase
):
    def test_aggregates_service_metrics(self):
        metrics = build_service_metrics(
            snapshot=make_snapshot()
        )

        values = {
            metric.key: metric.value
            for metric in metrics
        }

        self.assertEqual(len(metrics), 10)
        self.assertEqual(
            values["service.total_count"],
            2,
        )
        self.assertEqual(
            values["service.historical_only_count"],
            1,
        )
        self.assertEqual(
            values["service.completed_bookings"],
            3,
        )
        self.assertEqual(
            values["service.completed_revenue_minor"],
            13_000,
        )
        self.assertEqual(
            values["service.other_bookings"],
            1,
        )

    def test_rejects_invalid_snapshot(self):
        with self.assertRaisesRegex(
            TypeError,
            "snapshot must be a ServiceSnapshot",
        ):
            build_service_metrics(
                snapshot=object()
            )

    async def test_builder_uses_execution_cache(self):
        provider = CountingServiceProvider()
        builder = ServiceMetricBuilder(
            provider=provider
        )

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        first = await builder(context)
        second = await builder(context)

        self.assertEqual(first, second)
        self.assertEqual(provider.calls, 1)

    def test_rejects_invalid_provider(self):
        with self.assertRaisesRegex(
            TypeError,
            "provider must satisfy ServiceProvider",
        ):
            ServiceMetricBuilder(
                provider=object()
            )


if __name__ == "__main__":
    unittest.main()
