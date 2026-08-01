import unittest
from datetime import UTC, datetime

from app.intelligence.capacity import CapacitySnapshot
from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
)
from app.intelligence.provider import RevenueSnapshot
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.provider_family_signals import (
    ProviderFamilySignalBuilder,
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
            gross_revenue_minor=50_000,
            previous_gross_revenue_minor=100_000,
            average_ticket_minor=12_500,
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
            booked_slots=11,
            completed_booking_count=8,
            active_staff_count=2,
            available_minutes=600,
            booked_minutes=660,
        )


class UnusedClientProvider:
    def get_client_snapshot(
        self,
        *,
        context,
    ):
        raise AssertionError(
            "client provider must not be loaded "
            "by the approved signal bridge"
        )


class UnusedServiceProvider:
    def get_service_snapshot(
        self,
        *,
        context,
    ):
        raise AssertionError(
            "service provider must not be loaded "
            "by the approved signal bridge"
        )


def make_family():
    return IntelligenceProviderFamily(
        revenue=CountingRevenueProvider(),
        capacity=CountingCapacityProvider(),
        client=UnusedClientProvider(),
        service=UnusedServiceProvider(),
    )


class ProviderFamilySignalTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_combines_and_prioritizes_policies(
        self,
    ):
        family = make_family()

        builder = ProviderFamilySignalBuilder(
            providers=family
        )

        signals = await builder(
            create_execution_context(
                IntelligenceContext(
                    owner_id="tenant-a",
                    currency="USD",
                )
            )
        )

        self.assertEqual(
            tuple(
                signal.code
                for signal in signals
            ),
            (
                "capacity.overloaded",
                "revenue.critical_decline",
            ),
        )

    async def test_reuses_execution_snapshots(
        self,
    ):
        family = make_family()

        builder = ProviderFamilySignalBuilder(
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

    def test_rejects_invalid_family(self):
        with self.assertRaisesRegex(
            TypeError,
            "providers must be an "
            "IntelligenceProviderFamily",
        ):
            ProviderFamilySignalBuilder(
                providers=object()
            )

    async def test_rejects_invalid_context(self):
        builder = ProviderFamilySignalBuilder(
            providers=make_family()
        )

        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            await builder(object())


if __name__ == "__main__":
    unittest.main()
