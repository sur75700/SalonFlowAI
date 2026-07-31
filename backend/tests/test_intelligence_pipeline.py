import unittest

from app.intelligence import (
    ConfidenceLevel,
    IntelligenceContext,
    IntelligencePipeline,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)


class IntelligencePipelineTests(unittest.TestCase):
    def test_pipeline_orchestrates_builders_in_order(self) -> None:
        calls: list[str] = []

        def build_signals(
            context: IntelligenceContext,
        ) -> tuple[Signal, ...]:
            calls.append("signals")
            self.assertEqual(context.owner_id, "tenant-a")

            return (
                Signal(
                    code="capacity",
                    title="Unused capacity",
                    description="Open appointment slots detected",
                    severity=SignalSeverity.OPPORTUNITY,
                ),
            )

        def build_metrics(
            context: IntelligenceContext,
        ) -> tuple[Metric, ...]:
            calls.append("metrics")
            self.assertEqual(context.currency, "AMD")

            return (
                Metric(
                    key="open_slots",
                    label="Open slots",
                    value=4,
                    unit="slots",
                ),
            )

        def build_recommendations(
            context: IntelligenceContext,
            signals: tuple[Signal, ...],
            metrics: tuple[Metric, ...],
        ) -> tuple[Recommendation, ...]:
            calls.append("recommendations")
            self.assertEqual(context.owner_id, "tenant-a")
            self.assertEqual(signals[0].code, "capacity")
            self.assertEqual(metrics[0].key, "open_slots")

            return (
                Recommendation(
                    code="promote_slots",
                    title="Promote open slots",
                    description="Target recently inactive clients",
                    priority=1,
                ),
            )

        def build_summary(
            context: IntelligenceContext,
            signals: tuple[Signal, ...],
            metrics: tuple[Metric, ...],
        ) -> str:
            calls.append("summary")
            self.assertEqual(context.timezone, "Asia/Yerevan")
            self.assertTrue(signals)
            self.assertTrue(metrics)

            return "One revenue opportunity was detected"

        def build_confidence(
            context: IntelligenceContext,
            signals: tuple[Signal, ...],
            metrics: tuple[Metric, ...],
            recommendations: tuple[Recommendation, ...],
        ) -> tuple[float, str]:
            calls.append("confidence")
            self.assertEqual(context.owner_id, "tenant-a")
            self.assertTrue(signals)
            self.assertTrue(metrics)
            self.assertTrue(recommendations)

            return 0.84, "Pipeline inputs are internally consistent"

        pipeline = IntelligencePipeline(
            signal_builder=build_signals,
            metric_builder=build_metrics,
            recommendation_builder=build_recommendations,
            summary_builder=build_summary,
            confidence_builder=build_confidence,
        )

        decision = pipeline.run(
            context=IntelligenceContext(
                owner_id="tenant-a",
                timezone="Asia/Yerevan",
                currency="AMD",
            ),
        )

        self.assertEqual(
            calls,
            [
                "signals",
                "metrics",
                "recommendations",
                "summary",
                "confidence",
            ],
        )
        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(
            decision.summary,
            "One revenue opportunity was detected",
        )
        self.assertEqual(decision.signals[0].code, "capacity")
        self.assertEqual(decision.metrics[0].key, "open_slots")
        self.assertEqual(
            decision.recommendations[0].code,
            "promote_slots",
        )
        self.assertEqual(decision.confidence.score, 0.84)
        self.assertEqual(
            decision.confidence.level,
            ConfidenceLevel.HIGH,
        )

    def test_pipeline_rejects_empty_summary_through_engine(self) -> None:
        pipeline = IntelligencePipeline(
            signal_builder=lambda context: (),
            metric_builder=lambda context: (),
            recommendation_builder=lambda context, signals, metrics: (),
            summary_builder=lambda context, signals, metrics: "   ",
            confidence_builder=lambda context, signals, metrics, recommendations: (
                0.5,
                "Valid confidence",
            ),
        )

        with self.assertRaises(ValueError):
            pipeline.run(
                context=IntelligenceContext(owner_id="tenant-a"),
            )


if __name__ == "__main__":
    unittest.main()
