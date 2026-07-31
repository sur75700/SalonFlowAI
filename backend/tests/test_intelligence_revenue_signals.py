import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence import (
    AnalyticsProvider,
    IntelligenceContext,
    RevenueSignalBuilder,
    RevenueSnapshot,
    SignalSeverity,
    build_revenue_signal,
    build_revenue_signals,
    classify_revenue_growth,
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


class IntelligenceRevenueSignalTests(unittest.TestCase):
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

    def test_classifies_growth_as_opportunity(self) -> None:
        self.assertIs(
            classify_revenue_growth(10.0),
            SignalSeverity.OPPORTUNITY,
        )
        self.assertIs(
            classify_revenue_growth(25.0),
            SignalSeverity.OPPORTUNITY,
        )

    def test_classifies_small_change_as_info(self) -> None:
        self.assertIs(
            classify_revenue_growth(9.99),
            SignalSeverity.INFO,
        )
        self.assertIs(
            classify_revenue_growth(-9.99),
            SignalSeverity.INFO,
        )

    def test_classifies_decline_as_warning(self) -> None:
        self.assertIs(
            classify_revenue_growth(-10.0),
            SignalSeverity.WARNING,
        )
        self.assertIs(
            classify_revenue_growth(-24.99),
            SignalSeverity.WARNING,
        )

    def test_classifies_large_decline_as_critical(
        self,
    ) -> None:
        self.assertIs(
            classify_revenue_growth(-25.0),
            SignalSeverity.CRITICAL,
        )
        self.assertIs(
            classify_revenue_growth(-60.0),
            SignalSeverity.CRITICAL,
        )

    def test_classification_rejects_invalid_value(
        self,
    ) -> None:
        with self.assertRaises(TypeError):
            classify_revenue_growth(True)

        with self.assertRaises(TypeError):
            classify_revenue_growth("10")  # type: ignore[arg-type]

    def test_builds_growth_signal_with_evidence(
        self,
    ) -> None:
        snapshot = self.build_snapshot()
        signal = build_revenue_signal(snapshot=snapshot)

        self.assertEqual(signal.code, "revenue.growth")
        self.assertIs(
            signal.severity,
            SignalSeverity.OPPORTUNITY,
        )
        self.assertEqual(len(signal.evidence), 1)

        evidence = signal.evidence[0]

        self.assertEqual(
            evidence.source,
            "revenue_snapshot",
        )
        self.assertEqual(
            evidence.observed_at,
            snapshot.period_end,
        )
        self.assertEqual(
            evidence.value["growth_percent"],
            20.0,
        )
        self.assertEqual(
            evidence.value["currency"],
            "AMD",
        )

    def test_builds_stable_signal(self) -> None:
        signal = build_revenue_signal(
            snapshot=self.build_snapshot(
                current=357_000,
                previous=350_000,
            )
        )

        self.assertEqual(signal.code, "revenue.stable")
        self.assertIs(
            signal.severity,
            SignalSeverity.INFO,
        )

    def test_builds_warning_signal(self) -> None:
        signal = build_revenue_signal(
            snapshot=self.build_snapshot(
                current=297_500,
                previous=350_000,
            )
        )

        self.assertEqual(signal.code, "revenue.decline")
        self.assertIs(
            signal.severity,
            SignalSeverity.WARNING,
        )

    def test_builds_critical_signal(self) -> None:
        signal = build_revenue_signal(
            snapshot=self.build_snapshot(
                current=245_000,
                previous=350_000,
            )
        )

        self.assertEqual(
            signal.code,
            "revenue.critical_decline",
        )
        self.assertIs(
            signal.severity,
            SignalSeverity.CRITICAL,
        )

    def test_signal_collection_is_tuple(self) -> None:
        signals = build_revenue_signals(
            snapshot=self.build_snapshot()
        )

        self.assertIsInstance(signals, tuple)
        self.assertEqual(len(signals), 1)

    def test_builder_reads_provider_once(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        provider = FakeAnalyticsProvider(
            self.build_snapshot()
        )

        self.assertIsInstance(provider, AnalyticsProvider)

        builder = RevenueSignalBuilder(provider=provider)
        signals = builder(context)

        self.assertEqual(provider.calls, [context])
        self.assertEqual(len(signals), 1)
        self.assertEqual(signals[0].code, "revenue.growth")

    def test_builder_rejects_cross_tenant_snapshot(
        self,
    ) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        provider = FakeAnalyticsProvider(
            self.build_snapshot(owner_id="tenant-b")
        )

        builder = RevenueSignalBuilder(provider=provider)

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
            RevenueSignalBuilder(
                provider=object(),  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
