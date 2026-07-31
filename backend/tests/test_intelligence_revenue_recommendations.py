import unittest

from app.intelligence import (
    ExpectedImpact,
    IntelligenceContext,
    Metric,
    RevenueRecommendationBuilder,
    Signal,
    SignalSeverity,
    build_revenue_recommendation,
    build_revenue_recommendations,
)


def signal(
    code: str,
    severity: SignalSeverity,
) -> Signal:
    return Signal(
        code=code,
        title="Revenue signal",
        description="Revenue signal description",
        severity=severity,
    )


def revenue_metrics(
    growth: float = 20.0,
) -> tuple[Metric, ...]:
    return (
        Metric(
            key="revenue.growth_percent",
            label="Revenue growth",
            value=growth,
            unit="percent",
        ),
    )


class RevenueRecommendationTests(unittest.TestCase):
    def test_growth_creates_scale_recommendation(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "revenue.growth",
                SignalSeverity.OPPORTUNITY,
            ),
            metrics=revenue_metrics(20.0),
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "revenue.scale_growth",
        )
        self.assertEqual(recommendation.priority, 3)
        self.assertIn(
            "20.00%",
            recommendation.description,
        )

    def test_stable_creates_monitor_recommendation(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "revenue.stable",
                SignalSeverity.INFO,
            ),
            metrics=revenue_metrics(2.0),
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "revenue.monitor_stability",
        )
        self.assertEqual(recommendation.priority, 4)

    def test_decline_creates_recovery_recommendation(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "revenue.decline",
                SignalSeverity.WARNING,
            ),
            metrics=revenue_metrics(-15.0),
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "revenue.recover_decline",
        )
        self.assertEqual(recommendation.priority, 2)

    def test_critical_decline_has_highest_priority(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "revenue.critical_decline",
                SignalSeverity.CRITICAL,
            ),
            metrics=revenue_metrics(-30.0),
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "revenue.emergency_recovery",
        )
        self.assertEqual(recommendation.priority, 1)

    def test_unknown_signal_is_ignored(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "capacity.high",
                SignalSeverity.WARNING,
            ),
            metrics=revenue_metrics(),
        )

        self.assertIsNone(recommendation)

    def test_expected_impact_contract(self) -> None:
        recommendation = build_revenue_recommendation(
            signal=signal(
                "revenue.decline",
                SignalSeverity.WARNING,
            ),
            metrics=revenue_metrics(-12.0),
        )

        assert recommendation is not None

        self.assertEqual(
            len(recommendation.expected_impacts),
            1,
        )
        self.assertIsInstance(
            recommendation.expected_impacts[0],
            ExpectedImpact,
        )
        self.assertGreater(
            recommendation.expected_impacts[0]
            .estimated_change,
            0,
        )

    def test_recommendations_are_prioritized(self) -> None:
        recommendations = build_revenue_recommendations(
            signals=(
                signal(
                    "revenue.stable",
                    SignalSeverity.INFO,
                ),
                signal(
                    "revenue.critical_decline",
                    SignalSeverity.CRITICAL,
                ),
                signal(
                    "revenue.growth",
                    SignalSeverity.OPPORTUNITY,
                ),
            ),
            metrics=revenue_metrics(),
        )

        self.assertEqual(
            tuple(item.priority for item in recommendations),
            (1, 3, 4),
        )

    def test_collection_is_immutable_tuple(self) -> None:
        recommendations = build_revenue_recommendations(
            signals=(
                signal(
                    "revenue.growth",
                    SignalSeverity.OPPORTUNITY,
                ),
            ),
            metrics=revenue_metrics(),
        )

        self.assertIsInstance(recommendations, tuple)

    def test_builder_is_pipeline_compatible(self) -> None:
        builder = RevenueRecommendationBuilder()

        recommendations = builder(
            IntelligenceContext(owner_id="tenant-a"),
            (
                signal(
                    "revenue.growth",
                    SignalSeverity.OPPORTUNITY,
                ),
            ),
            revenue_metrics(),
        )

        self.assertEqual(len(recommendations), 1)
        self.assertEqual(
            recommendations[0].code,
            "revenue.scale_growth",
        )

    def test_builder_rejects_invalid_context(self) -> None:
        builder = RevenueRecommendationBuilder()

        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            builder(
                object(),  # type: ignore[arg-type]
                (),
                (),
            )


if __name__ == "__main__":
    unittest.main()
