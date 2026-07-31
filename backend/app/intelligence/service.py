from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import IntelligenceDecision
from app.intelligence.pipeline import IntelligencePipeline


class IntelligenceService:
    """Stable application-facing facade for intelligence execution."""

    def __init__(
        self,
        *,
        pipeline: IntelligencePipeline,
    ) -> None:
        self._pipeline = pipeline

    def analyze(
        self,
        *,
        context: IntelligenceContext,
    ) -> IntelligenceDecision:
        decision = self._pipeline.run(context=context)

        if decision.owner_id != context.owner_id:
            raise RuntimeError(
                "intelligence decision owner does not match context owner"
            )

        return decision
