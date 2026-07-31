import unittest
from unittest.mock import Mock

from app.intelligence import (
    IntelligenceBuilders,
    IntelligenceContext,
    IntelligenceEngine,
    IntelligenceService,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
    create_intelligence_service,
)


def build_signals(
    context: IntelligenceContext,
) -> tuple[Signal, ...]:
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
    return 0.83, "Factory-composed inputs are consistent"


class IntelligenceFactoryTests(unittest.IsolatedAsyncioTestCase):
    def build_bundle(self) -> IntelligenceBuilders:
        return IntelligenceBuilders(
            signal_builder=build_signals,
            metric_builder=build_metrics,
            recommendation_builder=build_recommendations,
            summary_builder=build_summary,
            confidence_builder=build_confidence,
        )

    async def test_factory_creates_working_service(self) -> None:
        service = create_intelligence_service(
            builders=self.build_bundle()
        )

        self.assertIsInstance(service, IntelligenceService)

        decision = await service.analyze(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(decision.owner_id, "tenant-a")
        self.assertEqual(decision.signals[0].code, "capacity")
        self.assertEqual(decision.metrics[0].key, "open_slots")
        self.assertEqual(
            decision.recommendations[0].code,
            "promote_slots",
        )
        self.assertEqual(decision.confidence.score, 0.83)

    async def test_factory_passes_custom_engine_to_pipeline(self) -> None:
        engine = Mock(spec=IntelligenceEngine)

        expected_decision = IntelligenceEngine().build_decision(
            context=IntelligenceContext(owner_id="tenant-a"),
            summary="Expected result",
            signals=(),
            metrics=(),
            recommendations=(),
            confidence_score=0.50,
            confidence_explanation="Expected confidence",
        )

        engine.build_decision.return_value = expected_decision

        service = create_intelligence_service(
            builders=self.build_bundle(),
            engine=engine,
        )

        result = await service.analyze(
            context=IntelligenceContext(owner_id="tenant-a")
        )

        self.assertIs(result, expected_decision)
        engine.build_decision.assert_called_once()


if __name__ == "__main__":
    unittest.main()
