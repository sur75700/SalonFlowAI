from app.intelligence.confidence import build_confidence
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    IntelligenceDecision,
    Metric,
    Recommendation,
    Signal,
)
from app.intelligence.reasoning import build_reasoning_notes
from app.intelligence.recommendations import prioritize_recommendations


class IntelligenceEngine:
    def build_decision(
        self,
        *,
        context: IntelligenceContext,
        summary: str,
        signals: tuple[Signal, ...],
        metrics: tuple[Metric, ...],
        recommendations: tuple[Recommendation, ...],
        confidence_score: float,
        confidence_explanation: str,
    ) -> IntelligenceDecision:
        if not summary.strip():
            raise ValueError("summary is required")

        reasoning_notes = build_reasoning_notes(
            signals=signals,
            metrics=metrics,
        )

        explanation_parts = [
            confidence_explanation.strip(),
            *reasoning_notes,
        ]

        explanation = " | ".join(
            part for part in explanation_parts if part
        )

        evidence_count = sum(
            len(signal.evidence)
            for signal in signals
        )

        return IntelligenceDecision(
            owner_id=context.owner_id,
            summary=summary,
            signals=signals,
            metrics=metrics,
            recommendations=prioritize_recommendations(recommendations),
            confidence=build_confidence(
                score=confidence_score,
                explanation=explanation,
                evidence_count=evidence_count,
            ),
            generated_at=context.generated_at,
        )
