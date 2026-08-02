import unittest

from app.intelligence.capacity_recommendations import (
    CapacityRecommendationBuilder,
    build_capacity_recommendation,
    build_capacity_recommendations,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Metric,
    Signal,
    SignalSeverity,
)


def make_signal(code: str) -> Signal:
    return Signal(
        code=code,
        title="Capacity signal",
        description="Capacity signal description",
        severity=SignalSeverity.INFO,
    )


METRICS = (
    Metric(
        key="capacity.utilization_percent",
        label="Capacity utilization",
        value=75.0,
        unit="percent",
    ),
)


class CapacityRecommendationTests(unittest.TestCase):
    def test_overloaded_recommendation(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.overloaded"),
            metrics=METRICS,
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "capacity.expand_capacity",
        )
        self.assertEqual(recommendation.priority, 1)
        self.assertEqual(
            recommendation.expected_impacts[0]
            .estimated_change,
            -15.0,
        )

    def test_near_limit_recommendation(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.near_limit"),
            metrics=METRICS,
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "capacity.prepare_capacity",
        )
        self.assertEqual(recommendation.priority, 2)

    def test_healthy_recommendation(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.healthy"),
            metrics=METRICS,
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "capacity.monitor_balance",
        )
        self.assertEqual(recommendation.priority, 4)

    def test_underutilized_recommendation(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.underutilized"),
            metrics=METRICS,
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "capacity.promote_open_slots",
        )
        self.assertEqual(recommendation.priority, 3)

    def test_idle_recommendation(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.idle"),
            metrics=METRICS,
        )

        self.assertIsNotNone(recommendation)
        assert recommendation is not None

        self.assertEqual(
            recommendation.code,
            "capacity.recover_idle_capacity",
        )
        self.assertEqual(recommendation.priority, 2)

    def test_unknown_signal_is_ignored(self) -> None:
        recommendation = build_capacity_recommendation(
            signal=make_signal("capacity.unknown"),
            metrics=METRICS,
        )

        self.assertIsNone(recommendation)

    def test_collection_is_prioritized(self) -> None:
        recommendations = build_capacity_recommendations(
            signals=(
                make_signal("capacity.healthy"),
                make_signal("capacity.underutilized"),
                make_signal("capacity.overloaded"),
            ),
            metrics=METRICS,
        )

        self.assertEqual(
            tuple(item.priority for item in recommendations),
            (1, 3, 4),
        )

    def test_collection_is_immutable_tuple(self) -> None:
        recommendations = build_capacity_recommendations(
            signals=(
                make_signal("capacity.healthy"),
            ),
            metrics=METRICS,
        )

        self.assertIsInstance(recommendations, tuple)

    def test_builder_is_pipeline_compatible(self) -> None:
        builder = CapacityRecommendationBuilder()

        recommendations = builder(
            IntelligenceContext(owner_id="tenant-a"),
            (
                make_signal("capacity.near_limit"),
            ),
            METRICS,
        )

        self.assertEqual(len(recommendations), 1)
        self.assertEqual(
            recommendations[0].code,
            "capacity.prepare_capacity",
        )

    def test_builder_rejects_invalid_context(self) -> None:
        builder = CapacityRecommendationBuilder()

        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            builder(
                "tenant-a",  # type: ignore[arg-type]
                (),
                METRICS,
            )

    def test_rejects_non_tuple_metrics(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "metrics must be a tuple",
        ):
            build_capacity_recommendation(
                signal=make_signal("capacity.healthy"),
                metrics=[],  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
