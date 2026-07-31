from collections.abc import Iterable

from app.intelligence.contracts import Recommendation


def prioritize_recommendations(
    recommendations: Iterable[Recommendation],
) -> tuple[Recommendation, ...]:
    return tuple(
        sorted(
            recommendations,
            key=lambda recommendation: (
                recommendation.priority,
                recommendation.code,
            ),
        )
    )


def top_recommendations(
    recommendations: Iterable[Recommendation],
    *,
    limit: int = 3,
) -> tuple[Recommendation, ...]:
    if limit < 0:
        raise ValueError("limit cannot be negative")

    return prioritize_recommendations(recommendations)[:limit]
