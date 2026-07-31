import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence import (
    AnalyticsProvider,
    IntelligenceContext,
    RevenueSnapshot,
)


class FakeAnalyticsProvider:
    def __init__(
        self,
        snapshot: RevenueSnapshot,
    ) -> None:
        self.snapshot = snapshot
        self.calls: list[IntelligenceContext] = []

    def get_revenue_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> RevenueSnapshot:
        self.calls.append(context)
        return self.snapshot


class IntelligenceProviderTests(unittest.TestCase):
    def build_snapshot(
        self,
        *,
        owner_id: str = "tenant-a",
    ) -> RevenueSnapshot:
        start = datetime(
            2026,
            7,
            20,
            tzinfo=UTC,
        )

        return RevenueSnapshot(
            owner_id=owner_id,
            period_start=start,
            period_end=start + timedelta(days=7),
            currency="amd",
            completed_booking_count=14,
            gross_revenue_minor=420_000,
            previous_gross_revenue_minor=350_000,
            average_ticket_minor=30_000,
        )

    def test_snapshot_normalizes_identity_and_currency(
        self,
    ) -> None:
        snapshot = self.build_snapshot(
            owner_id="  tenant-a  "
        )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "AMD")

    def test_snapshot_is_immutable(self) -> None:
        snapshot = self.build_snapshot()

        with self.assertRaises(AttributeError):
            snapshot.gross_revenue_minor = 1  # type: ignore[misc]

    def test_snapshot_rejects_invalid_period(self) -> None:
        instant = datetime(
            2026,
            7,
            20,
            tzinfo=UTC,
        )

        with self.assertRaisesRegex(
            ValueError,
            "period_end must be later",
        ):
            RevenueSnapshot(
                owner_id="tenant-a",
                period_start=instant,
                period_end=instant,
                currency="AMD",
                completed_booking_count=0,
                gross_revenue_minor=0,
                previous_gross_revenue_minor=0,
                average_ticket_minor=0,
            )

    def test_snapshot_rejects_negative_values(self) -> None:
        start = datetime(
            2026,
            7,
            20,
            tzinfo=UTC,
        )

        with self.assertRaisesRegex(
            ValueError,
            "gross_revenue_minor cannot be negative",
        ):
            RevenueSnapshot(
                owner_id="tenant-a",
                period_start=start,
                period_end=start + timedelta(days=7),
                currency="AMD",
                completed_booking_count=1,
                gross_revenue_minor=-1,
                previous_gross_revenue_minor=0,
                average_ticket_minor=0,
            )

    def test_fake_provider_satisfies_protocol(self) -> None:
        provider = FakeAnalyticsProvider(
            self.build_snapshot()
        )

        self.assertIsInstance(provider, AnalyticsProvider)

    def test_provider_returns_tenant_snapshot(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        snapshot = self.build_snapshot()
        provider = FakeAnalyticsProvider(snapshot)

        result = provider.get_revenue_snapshot(
            context=context
        )

        self.assertIs(result, snapshot)
        self.assertEqual(provider.calls, [context])
        self.assertEqual(result.owner_id, context.owner_id)


if __name__ == "__main__":
    unittest.main()
