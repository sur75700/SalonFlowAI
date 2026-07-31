import unittest

from app.intelligence import (
    IntelligenceContext,
    IntelligencePipeline,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)


def valid_signal() -> Signal:
    return Signal(
        code="capacity",
        title="Unused capacity",
        description="Open slots detected",
        severity=SignalSeverity.OPPORTUNITY,
    )


def valid_metric() -> Metric:
    return Metric(
        key="open_slots",
        label="Open slots",
        value=3,
        unit="slots",
    )


def valid_recommendation() -> Recommendation:
    return Recommendation(
        code="promote_slots",
        title="Promote open slots",
        description="Target inactive clients",
        priority=1,
    )


class IntelligencePipelineValidationTests(unittest.TestCase):
    def build_pipeline(
        self,
        *,
        signal_builder=None,
        metric_builder=None,
        recommendation_builder=None,
        summary_builder=None,
        confidence_builder=None,
    ) -> IntelligencePipeline:
        return IntelligencePipeline(
            signal_builder=signal_builder
            or (lambda context: (valid_signal(),)),
            metric_builder=metric_builder
            or (lambda context: (valid_metric(),)),
            recommendation_builder=recommendation_builder
            or (
                lambda context, signals, metrics: (
                    valid_recommendation(),
                )
            ),
            summary_builder=summary_builder
            or (
                lambda context, signals, metrics: (
                    "Revenue opportunity detected"
                )
            ),
            confidence_builder=confidence_builder
            or (
                lambda context, signals, metrics, recommendations: (
                    0.80,
                    "Strong recent data",
                )
            ),
        )

    def test_valid_builder_outputs_reach_engine(self) -> None:
        decision = self.build_pipeline().run(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(decision.signals[0].code, "capacity")
        self.assertEqual(decision.metrics[0].key, "open_slots")
        self.assertEqual(
            decision.recommendations[0].code,
            "promote_slots",
        )
        self.assertEqual(decision.confidence.score, 0.80)

    def test_non_tuple_signals_are_rejected(self) -> None:
        pipeline = self.build_pipeline(
            signal_builder=lambda context: [valid_signal()],
        )

        with self.assertRaisesRegex(
            TypeError,
            "signals must be a tuple",
        ):
            pipeline.run(
                context=IntelligenceContext(owner_id="tenant-a")
            )

    def test_duplicate_metrics_are_rejected(self) -> None:
        metric = valid_metric()

        pipeline = self.build_pipeline(
            metric_builder=lambda context: (metric, metric),
        )

        with self.assertRaisesRegex(
            ValueError,
            "duplicate metric key",
        ):
            pipeline.run(
                context=IntelligenceContext(owner_id="tenant-a")
            )

    def test_duplicate_recommendations_are_rejected(self) -> None:
        recommendation = valid_recommendation()

        pipeline = self.build_pipeline(
            recommendation_builder=(
                lambda context, signals, metrics: (
                    recommendation,
                    recommendation,
                )
            ),
        )

        with self.assertRaisesRegex(
            ValueError,
            "duplicate recommendation code",
        ):
            pipeline.run(
                context=IntelligenceContext(owner_id="tenant-a")
            )

    def test_summary_is_normalized_before_engine(self) -> None:
        pipeline = self.build_pipeline(
            summary_builder=(
                lambda context, signals, metrics: (
                    "  Revenue opportunity detected  "
                )
            ),
        )

        decision = pipeline.run(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(
            decision.summary,
            "Revenue opportunity detected",
        )

    def test_invalid_confidence_is_rejected_before_engine(
        self,
    ) -> None:
        pipeline = self.build_pipeline(
            confidence_builder=(
                lambda context, signals, metrics, recommendations: (
                    1.20,
                    "Invalid score",
                )
            ),
        )

        with self.assertRaisesRegex(
            ValueError,
            "confidence score must be between",
        ):
            pipeline.run(
                context=IntelligenceContext(owner_id="tenant-a")
            )

    def test_confidence_explanation_is_normalized(self) -> None:
        pipeline = self.build_pipeline(
            confidence_builder=(
                lambda context, signals, metrics, recommendations: (
                    0.75,
                    "  Verified inputs  ",
                )
            ),
        )

        decision = pipeline.run(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertTrue(
            decision.confidence.explanation.startswith(
                "Verified inputs"
            )
        )


if __name__ == "__main__":
    unittest.main()
