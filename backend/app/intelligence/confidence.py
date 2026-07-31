from app.intelligence.contracts import Confidence, ConfidenceLevel


def confidence_level(score: float) -> ConfidenceLevel:
    if not 0.0 <= score <= 1.0:
        raise ValueError("Confidence score must be between 0.0 and 1.0")

    if score >= 0.75:
        return ConfidenceLevel.HIGH

    if score >= 0.45:
        return ConfidenceLevel.MEDIUM

    return ConfidenceLevel.LOW


def build_confidence(
    *,
    score: float,
    explanation: str,
    evidence_count: int = 0,
) -> Confidence:
    if evidence_count < 0:
        raise ValueError("evidence_count cannot be negative")

    if not explanation.strip():
        raise ValueError("explanation is required")

    return Confidence(
        score=score,
        level=confidence_level(score),
        explanation=explanation,
        evidence_count=evidence_count,
    )
