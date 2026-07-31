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


if __name__ == "__main__":
    unittest.main()
