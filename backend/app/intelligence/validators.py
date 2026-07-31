from collections.abc import Iterable

from app.intelligence.contracts import Metric, Recommendation, Signal


def _require_unique(
    values: Iterable[str],
    *,
    field_name: str,
) -> None:
    seen: set[str] = set()

    for value in values:
        normalized = value.strip()

        if not normalized:
            raise ValueError(f"{field_name} cannot be empty")

        if normalized in seen:
            raise ValueError(
                f"duplicate {field_name}: {normalized}"
            )

        seen.add(normalized)


def validate_signals(
    signals: tuple[Signal, ...],
) -> tuple[Signal, ...]:
    if not isinstance(signals, tuple):
        raise TypeError("signals must be a tuple")

    _require_unique(
        (signal.code for signal in signals),
        field_name="signal code",
    )

    return signals


def validate_metrics(
    metrics: tuple[Metric, ...],
) -> tuple[Metric, ...]:
    if not isinstance(metrics, tuple):
        raise TypeError("metrics must be a tuple")

    _require_unique(
        (metric.key for metric in metrics),
        field_name="metric key",
    )

    return metrics


def validate_recommendations(
    recommendations: tuple[Recommendation, ...],
) -> tuple[Recommendation, ...]:
    if not isinstance(recommendations, tuple):
        raise TypeError("recommendations must be a tuple")

    _require_unique(
        (
            recommendation.code
            for recommendation in recommendations
        ),
        field_name="recommendation code",
    )

    return recommendations


def validate_summary(summary: str) -> str:
    normalized = summary.strip()

    if not normalized:
        raise ValueError("summary is required")

    return normalized


def validate_confidence_input(
    score: float,
    explanation: str,
) -> tuple[float, str]:
    if isinstance(score, bool) or not isinstance(
        score,
        (int, float),
    ):
        raise TypeError("confidence score must be numeric")

    normalized_score = float(score)

    if not 0.0 <= normalized_score <= 1.0:
        raise ValueError(
            "confidence score must be between 0.0 and 1.0"
        )

    normalized_explanation = explanation.strip()

    if not normalized_explanation:
        raise ValueError(
            "confidence explanation is required"
        )

    return normalized_score, normalized_explanation
