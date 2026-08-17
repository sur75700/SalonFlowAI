import unittest

from app.intelligence import (
    ConfidenceLevel,
    Evidence,
    IntelligenceContext,
    IntelligenceEngine,
    Metric,
    MetricRegistry,
    Recommendation,
    Signal,
    SignalRegistry,
    SignalSeverity,
    build_confidence,
)


class IntelligenceFoundationTests(unittest.TestCase):
    def test_context_rejects_empty_owner(self) -> None:
        with self.assertRaises(ValueError):
            IntelligenceContext(owner_id="")

    def test_confidence_levels(self) -> None:
        self.assertEqual(
            build_confidence(
                score=0.20,
                explanation="Limited evidence",
            ).level,
            ConfidenceLevel.LOW,
        )
        self.assertEqual(
            build_confidence(
                score=0.60,
                explanation="Moderate evidence",
            ).level,
            ConfidenceLevel.MEDIUM,
        )
        self.assertEqual(
            build_confidence(
                score=0.90,
                explanation="Strong evidence",
            ).level,
            ConfidenceLevel.HIGH,
        )

    def test_signal_registry(self) -> None:
        registry = SignalRegistry()
        signal = Signal(
            code="capacity",
            title="Unused capacity",
            description="Open slots detected",
            severity=SignalSeverity.OPPORTUNITY,
        )

        registry.add(signal)

        self.assertEqual(registry.all(), (signal,))
        self.assertEqual(len(registry), 1)

    def test_metric_registry_rejects_duplicates(self) -> None:
        registry = MetricRegistry()
        metric = Metric(
            key="revenue",
            label="Revenue",
            value=100000,
            unit="AMD",
        )

        registry.add(metric)

        with self.assertRaises(ValueError):
            registry.add(metric)

    def test_engine_builds_tenant_bound_decision(self) -> None:
        engine = IntelligenceEngine()

        decision = engine.build_decision(
            context=IntelligenceContext(
                owner_id="tenant-a",
                timezone="Asia/Yerevan",
                currency="AMD",
            ),
            summary="Revenue opportunity detected",
            signals=(
                Signal(
                    code="capacity",
                    title="Unused capacity",
                    description="Three open slots detected",
                    severity=SignalSeverity.OPPORTUNITY,
                    evidence=(
                        Evidence(
                            source="appointments",
                            description="Three open slots",
                        ),
                    ),
                ),
            ),
            metrics=(
                Metric(
                    key="open_slots",
                    label="Open slots",
                    value=3,
                    unit="slots",
                ),
            ),
            recommendations=(
                Recommendation(
                    code="promote_slots",
                    title="Promote open slots",
                    description="Target inactive clients",
                    priority=1,
                ),
            ),
            confidence_score=0.82,
            confidence_explanation="Recent business data available",
        )

        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(decision.confidence.level, ConfidenceLevel.HIGH)
        self.assertEqual(decision.confidence.evidence_count, 1)
        self.assertEqual(
            decision.recommendations[0].code,
            "promote_slots",
        )


class Phase63DLocalDateWindowUtcTests(unittest.TestCase):
    def resolve(self, start, end, timezone_name):
        from app.intelligence.models.windows import (
            resolve_local_date_window_utc,
        )
        return resolve_local_date_window_utc(
            start=start,
            end=end,
            timezone_name=timezone_name,
        )

    def test_utc_single_day(self):
        from datetime import UTC, date, datetime
        start, end = self.resolve(date(2026, 7, 1), date(2026, 7, 1), "UTC")
        self.assertEqual(start, datetime(2026, 7, 1, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 7, 2, tzinfo=UTC))

    def test_asia_yerevan_single_day(self):
        from datetime import UTC, date, datetime
        start, end = self.resolve(date(2026, 7, 1), date(2026, 7, 1), "Asia/Yerevan")
        self.assertEqual(start, datetime(2026, 6, 30, 20, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 7, 1, 20, tzinfo=UTC))

    def test_negative_offset_timezone(self):
        from datetime import UTC, date, datetime
        start, end = self.resolve(
            date(2026, 1, 15),
            date(2026, 1, 15),
            "America/Los_Angeles",
        )
        self.assertEqual(start, datetime(2026, 1, 15, 8, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 1, 16, 8, tzinfo=UTC))

    def test_multi_day_month_boundary(self):
        from datetime import UTC, date, datetime
        start, end = self.resolve(date(2026, 1, 31), date(2026, 2, 2), "UTC")
        self.assertEqual(start, datetime(2026, 1, 31, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 2, 3, tzinfo=UTC))

    def test_year_boundary(self):
        from datetime import UTC, date, datetime
        start, end = self.resolve(date(2026, 12, 31), date(2027, 1, 1), "UTC")
        self.assertEqual(start, datetime(2026, 12, 31, tzinfo=UTC))
        self.assertEqual(end, datetime(2027, 1, 2, tzinfo=UTC))

    def test_dst_spring_forward_is_23_hours(self):
        from datetime import UTC, date, datetime, timedelta
        start, end = self.resolve(
            date(2026, 3, 8),
            date(2026, 3, 8),
            "America/New_York",
        )
        self.assertEqual(start, datetime(2026, 3, 8, 5, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 3, 9, 4, tzinfo=UTC))
        self.assertEqual(end - start, timedelta(hours=23))

    def test_dst_fall_back_is_25_hours(self):
        from datetime import UTC, date, datetime, timedelta
        start, end = self.resolve(
            date(2026, 11, 1),
            date(2026, 11, 1),
            "America/New_York",
        )
        self.assertEqual(start, datetime(2026, 11, 1, 4, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 11, 2, 5, tzinfo=UTC))
        self.assertEqual(end - start, timedelta(hours=25))

    def test_invalid_timezone_fails_closed(self):
        from datetime import date

        for timezone_name in (
            "Mars/Olympus",
            "/etc/passwd",
            "../UTC",
            "UTC\x00invalid",
        ):
            with self.subTest(timezone_name=timezone_name):
                with self.assertRaisesRegex(
                    ValueError,
                    "valid IANA timezone",
                ):
                    self.resolve(
                        date(2026, 7, 1),
                        date(2026, 7, 1),
                        timezone_name,
                    )

    def test_midnight_gap_resolves_to_first_valid_instant(self):
        from datetime import UTC, date, datetime, timedelta

        start, end = self.resolve(
            date(2026, 3, 8),
            date(2026, 3, 8),
            "America/Havana",
        )
        self.assertEqual(start, datetime(2026, 3, 8, 5, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 3, 9, 4, tzinfo=UTC))
        self.assertEqual(end - start, timedelta(hours=23))

    def test_midnight_fold_uses_first_occurrence(self):
        from datetime import UTC, date, datetime, timedelta

        start, end = self.resolve(
            date(2026, 11, 1),
            date(2026, 11, 1),
            "America/Havana",
        )
        self.assertEqual(start, datetime(2026, 11, 1, 4, tzinfo=UTC))
        self.assertEqual(end, datetime(2026, 11, 2, 5, tzinfo=UTC))
        self.assertEqual(end - start, timedelta(hours=25))

    def test_skipped_local_date_fails_closed(self):
        from datetime import date

        with self.assertRaisesRegex(ValueError, "positive period"):
            self.resolve(
                date(2011, 12, 30),
                date(2011, 12, 30),
                "Pacific/Apia",
            )

    def test_day_before_skipped_date_keeps_exact_boundary(self):
        from datetime import UTC, date, datetime

        start, end = self.resolve(
            date(2011, 12, 29),
            date(2011, 12, 29),
            "Pacific/Apia",
        )
        self.assertEqual(start, datetime(2011, 12, 29, 10, tzinfo=UTC))
        self.assertEqual(end, datetime(2011, 12, 30, 10, tzinfo=UTC))

if __name__ == "__main__":
    unittest.main()


class IntelligenceContextModelTests(unittest.TestCase):

    def test_analysis_window_days(self) -> None:
        from datetime import date

        from app.intelligence.models import AnalysisWindow

        window = AnalysisWindow(
            start=date(2026, 8, 1),
            end=date(2026, 8, 7),
            label="weekly",
        )

        self.assertEqual(
            window.days,
            7,
        )

    def test_analysis_window_rejects_invalid_range(self) -> None:
        from datetime import date

        from app.intelligence.models import AnalysisWindow

        with self.assertRaises(ValueError):
            AnalysisWindow(
                start=date(2026, 8, 10),
                end=date(2026, 8, 1),
            )

    def test_business_state_utilization(self) -> None:
        from app.intelligence.models import BusinessState

        state = BusinessState(
            open_slots=20,
            booked_slots=80,
        )

        self.assertEqual(
            state.utilization_rate,
            0.8,
        )

    def test_business_state_rejects_negative_values(self) -> None:
        from app.intelligence.models import BusinessState

        with self.assertRaises(ValueError):
            BusinessState(
                revenue_minor=-1,
            )

    def test_context_default_flags(self) -> None:
        from app.intelligence import IntelligenceContext

        context = IntelligenceContext(
            owner_id="tenant-cosmos",
        )

        self.assertTrue(
            context.flags.recommendations_enabled
        )
        self.assertIsNone(
            context.window
        )
        self.assertIsNone(
            context.business
        )
