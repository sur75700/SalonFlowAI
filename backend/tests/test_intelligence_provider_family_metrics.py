import unittest
from datetime import UTC, datetime

from app.intelligence.capacity import CapacitySnapshot
from app.intelligence.client_intelligence import (
    ClientSnapshot,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
)
from app.intelligence.provider import RevenueSnapshot
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.provider_family_metrics import (
    ProviderFamilyMetricBuilder,
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
            previous_gross_revenue_minor=15_000,
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


class ProviderFamilyMetricTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_combines_all_four_domains(self):
        family = make_family()
        builder = ProviderFamilyMetricBuilder(
            providers=family
        )

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        metrics = await builder(context)

        keys = {
            metric.key
            for metric in metrics
        }

        self.assertIn(
            "revenue.current",
            keys,
        )
        self.assertIn(
            "capacity.utilization_percent",
            keys,
        )
        self.assertIn(
            "client.total_count",
            keys,
        )
        self.assertIn(
            "service.total_count",
            keys,
        )

    async def test_reuses_all_execution_snapshots(self):
        family = make_family()
        builder = ProviderFamilyMetricBuilder(
            providers=family
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
        self.assertEqual(family.revenue.calls, 1)
        self.assertEqual(family.capacity.calls, 1)
        self.assertEqual(family.client.calls, 1)
        self.assertEqual(family.service.calls, 1)

    async def test_metric_keys_are_unique(self):
        family = make_family()
        builder = ProviderFamilyMetricBuilder(
            providers=family
        )

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        metrics = await builder(context)

        keys = tuple(
            metric.key
            for metric in metrics
        )

        self.assertEqual(
            len(keys),
            len(set(keys)),
        )

    def test_rejects_invalid_family(self):
        with self.assertRaisesRegex(
            TypeError,
            "providers must be an "
            "IntelligenceProviderFamily",
        ):
            ProviderFamilyMetricBuilder(
                providers=object()
            )


if __name__ == "__main__":
    unittest.main()
