import unittest

from app.intelligence import (
    IntelligenceBuilders,
    IntelligenceContext,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)


def build_signals(
    context: IntelligenceContext,
) -> tuple[Signal, ...]:
    return (
        Signal(
            code="capacity",
            title="Unused capacity",
            description=(
                f"Open capacity detected for {context.owner_id}"
            ),
            severity=SignalSeverity.OPPORTUNITY,
        ),
    )


def build_metrics(
    context: IntelligenceContext,
) -> tuple[Metric, ...]:
    return (
        Metric(
            key="open_slots",
            label="Open slots",
            value=3,
            unit="slots",
        ),
    )


def build_recommendations(
    context: IntelligenceContext,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
) -> tuple[Recommendation, ...]:
    return (
        Recommendation(
            code="promote_slots",
            title="Promote open slots",
            description="Target inactive clients",
            priority=1,
        ),
    )


def build_summary(
    context: IntelligenceContext,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
) -> str:
    return "Revenue opportunity detected"


def build_confidence(
    context: IntelligenceContext,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
    recommendations: tuple[Recommendation, ...],
) -> tuple[float, str]:
    return 0.81, "Builder inputs are consistent"


class IntelligenceBuilderTests(unittest.IsolatedAsyncioTestCase):
    def build_bundle(self) -> IntelligenceBuilders:
        return IntelligenceBuilders(
            signal_builder=build_signals,
            metric_builder=build_metrics,
            recommendation_builder=build_recommendations,
            summary_builder=build_summary,
            confidence_builder=build_confidence,
        )

    async def test_builder_bundle_creates_working_pipeline(self) -> None:
        pipeline = self.build_bundle().create_pipeline()

        decision = await pipeline.run(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(decision.signals[0].code, "capacity")
        self.assertEqual(decision.metrics[0].key, "open_slots")
        self.assertEqual(
            decision.recommendations[0].code,
            "promote_slots",
        )
        self.assertEqual(decision.confidence.score, 0.81)

    async def test_builder_bundle_is_immutable(self) -> None:
        builders = self.build_bundle()

        with self.assertRaises(
            AttributeError,
        ):
            builders.signal_builder = build_signals  # type: ignore[misc]

    async def test_non_callable_builder_is_rejected(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "signal_builder must be callable",
        ):
            IntelligenceBuilders(
                signal_builder=None,  # type: ignore[arg-type]
                metric_builder=build_metrics,
                recommendation_builder=build_recommendations,
                summary_builder=build_summary,
                confidence_builder=build_confidence,
            )


if __name__ == "__main__":
    unittest.main()
