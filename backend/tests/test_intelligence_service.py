import unittest
from unittest.mock import Mock

from app.intelligence import (
    Confidence,
    ConfidenceLevel,
    IntelligenceContext,
    IntelligenceDecision,
    IntelligenceService,
)


class IntelligenceServiceTests(unittest.TestCase):
    def build_decision(
        self,
        *,
        owner_id: str = "tenant-a",
    ) -> IntelligenceDecision:
        return IntelligenceDecision(
            owner_id=owner_id,
            summary="Revenue opportunity detected",
            signals=(),
            metrics=(),
            recommendations=(),
            confidence=Confidence(
                score=0.80,
                level=ConfidenceLevel.HIGH,
                explanation="Strong recent data",
                evidence_count=0,
            ),
        )

    def test_service_delegates_to_pipeline(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")
        decision = self.build_decision()

        pipeline = Mock()
        pipeline.run.return_value = decision

        service = IntelligenceService(pipeline=pipeline)

        result = service.analyze(context=context)

        pipeline.run.assert_called_once_with(context=context)
        self.assertIs(result, decision)
        self.assertEqual(result.owner_id, "tenant-a")

    def test_service_rejects_cross_tenant_decision(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")

        pipeline = Mock()
        pipeline.run.return_value = self.build_decision(
            owner_id="tenant-b"
        )

        service = IntelligenceService(pipeline=pipeline)

        with self.assertRaisesRegex(
            RuntimeError,
            "decision owner does not match context owner",
        ):
            service.analyze(context=context)

        pipeline.run.assert_called_once_with(context=context)

    def test_pipeline_exception_is_not_hidden(self) -> None:
        context = IntelligenceContext(owner_id="tenant-a")

        pipeline = Mock()
        pipeline.run.side_effect = ValueError(
            "invalid builder output"
        )

        service = IntelligenceService(pipeline=pipeline)

        with self.assertRaisesRegex(
            ValueError,
            "invalid builder output",
        ):
            service.analyze(context=context)


if __name__ == "__main__":
    unittest.main()
