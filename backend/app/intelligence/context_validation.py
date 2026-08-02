from app.intelligence.context import IntelligenceContext


def validate_intelligence_context(
    context: IntelligenceContext,
) -> IntelligenceContext:
    """
    Validates intelligence execution context before pipeline execution.
    """

    if not context.owner_id.strip():
        raise ValueError(
            "intelligence context owner_id is required"
        )

    if context.window is not None:
        if context.window.days <= 0:
            raise ValueError(
                "analysis window must contain days"
            )

    if context.business is not None:
        if context.business.utilization_rate > 1:
            raise ValueError(
                "business utilization is invalid"
            )

    if context.flags is None:
        raise ValueError(
            "intelligence flags are required"
        )

    return context
