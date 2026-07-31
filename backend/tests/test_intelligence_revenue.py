import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence import (
    AnalyticsProvider,
    IntelligenceContext,
    RevenueMetricBuilder,
    RevenueSnapshot,
    build_revenue_metrics,
    calculate_revenue_growth_percent,
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


class IntelligenceRevenueTests(unittest.TestCase):
    def build_snapshot(
        self,
        *,
        owner_id: str = "tenant-a",
        current: int = 420_000,
        previous: int = 350_000,
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
            currency="AMD",
            completed_booking_count=14,
            gross_revenue_minor=current,
            previous_gross_revenue_minor=previous,
            average_ticket_minor=30_000,
        )

    def test_growth_percent_for_increase(self) -> None:
        self.assertEqual(
            calculate_revenue_growth_percent(
                current_revenue_minor=420_000,
                previous_revenue_minor=350_000,
            ),
            20.0,
        )

    def test_growth_percent_for_decline(self) -> None:
        self.assertEqual(
            calculate_revenue_growth_percent(
                current_revenue_minor=280_000,
                previous_revenue_minor=350_000,
            ),
            -20.0,
        )

    def test_growth_percent_handles_zero_baseline(
        self,
    ) -> None:
        self.assertEqual(
            calculate_revenue_growth_percent(
                current_revenue_minor=0,
                previous_revenue_minor=0,
            ),
            0.0,
        )

        self.assertEqual(
            calculate_revenue_growth_percent(
                current_revenue_minor=100_000,
                previous_revenue_minor=0,
            ),
            100.0,
        )

    def test_growth_rejects_invalid_values(self) -> None:
        with self.assertRaises(TypeError):
            calculate_revenue_growth_percent(
                current_revenue_minor=True,
                previous_revenue_minor=0,
            )

        with self.assertRaisesRegex(
            ValueError,
            "current_revenue_minor cannot be negative",
        ):
            calculate_revenue_growth_percent(
                current_revenue_minor=-1,
                previous_revenue_minor=0,
            )

    def test_snapshot_builds_expected_metrics(self) -> None:
        metrics = build_revenue_metrics(
            snapshot=self.build_snapshot()
        )

        values = {
            metric.key: metric.value
            for metric in metrics
        }

        units = {
            metric.key: metric.unit
            for metric in metrics
        }

        self.assertEqual(len(metrics), 5)
        self.assertEqual(
            values["revenue.current"],
            420_000,
        )
        self.assertEqual(
            values["revenue.previous"],
            350_000,
        )
        self.assertEqual(
            values["revenue.growth_percent"],
            20.0,
        )
        self.assertEqual(
            values["revenue.completed_bookings"],
            14,
        )
        self.assertEqual(
            values["revenue.average_ticket"],
            30_000,
        )
        self.assertEqual(
            units["revenue.current"],
            "AMD",
        )
        self.assertEqual(
            units["revenue.growth_percent"],
            "percent",
        )

    def test_builder_reads_provider_once(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        provider = FakeAnalyticsProvider(
            self.build_snapshot()
        )

        self.assertIsInstance(provider, AnalyticsProvider)

        builder = RevenueMetricBuilder(provider=provider)
        metrics = builder(context)

        self.assertEqual(provider.calls, [context])
        self.assertEqual(len(metrics), 5)

    def test_builder_rejects_cross_tenant_snapshot(
        self,
    ) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        provider = FakeAnalyticsProvider(
            self.build_snapshot(owner_id="tenant-b")
        )

        builder = RevenueMetricBuilder(provider=provider)

        with self.assertRaisesRegex(
            RuntimeError,
            "snapshot owner does not match context owner",
        ):
            builder(context)

        self.assertEqual(provider.calls, [context])

    def test_builder_rejects_invalid_provider(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "provider must satisfy AnalyticsProvider",
        ):
            RevenueMetricBuilder(
                provider=object(),  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
