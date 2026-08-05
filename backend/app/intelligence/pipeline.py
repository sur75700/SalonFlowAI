from app.observability.metrics import instrument_decision, instrument_pipeline_stage
import inspect
from collections.abc import Callable

from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    IntelligenceDecision,
    Metric,
    Recommendation,
    Signal,
)
from app.intelligence.engine import IntelligenceEngine
from app.intelligence.execution import create_execution_context
from app.intelligence.context_validation import (
    validate_intelligence_context,
)
from app.intelligence.validators import (
    validate_confidence_input,
    validate_metrics,
    validate_recommendations,
    validate_signals,
    validate_summary,
)


SignalBuilder = Callable[[IntelligenceContext], tuple[Signal, ...]]
MetricBuilder = Callable[[IntelligenceContext], tuple[Metric, ...]]
RecommendationBuilder = Callable[
    [IntelligenceContext, tuple[Signal, ...], tuple[Metric, ...]],
    tuple[Recommendation, ...],
]
SummaryBuilder = Callable[
    [IntelligenceContext, tuple[Signal, ...], tuple[Metric, ...]],
    str,
]
ConfidenceBuilder = Callable[
    [
        IntelligenceContext,
        tuple[Signal, ...],
        tuple[Metric, ...],
        tuple[Recommendation, ...],
    ],
    tuple[float, str],
]



@instrument_pipeline_stage(stage="resolve")
async def _resolve(value):
    if inspect.isawaitable(value):
        return await value
    return value

class IntelligencePipeline:
    def __init__(
        self,
        *,
        signal_builder: SignalBuilder,
        metric_builder: MetricBuilder,
        recommendation_builder: RecommendationBuilder,
        summary_builder: SummaryBuilder,
        confidence_builder: ConfidenceBuilder,
        engine: IntelligenceEngine | None = None,
    ) -> None:
        self._signal_builder = signal_builder
        self._metric_builder = metric_builder
        self._recommendation_builder = recommendation_builder
        self._summary_builder = summary_builder
        self._confidence_builder = confidence_builder
        self._engine = engine or IntelligenceEngine()

    @instrument_decision()
    async def run(
        self,
        *,
        context: IntelligenceContext,
    ) -> IntelligenceDecision:
        context = validate_intelligence_context(
            context
        )

        execution_context = create_execution_context(
            context
        )

        signals = validate_signals(
            await _resolve(self._signal_builder(execution_context))
        )
        metrics = validate_metrics(
            await _resolve(self._metric_builder(execution_context))
        )

        recommendations = validate_recommendations(
            await _resolve(self._recommendation_builder(
                execution_context,
                signals,
                metrics,
            )
        ))

        summary = validate_summary(
            await _resolve(self._summary_builder(
                execution_context,
                signals,
                metrics,
            )
        ))

        confidence_result = await _resolve(
            self._confidence_builder(
                execution_context,
                signals,
                metrics,
                recommendations,
            )
        )

        confidence_score, confidence_explanation = (
            validate_confidence_input(
                *confidence_result
            )
        )

        return self._engine.build_decision(
            context=context,
            summary=summary,
            signals=signals,
            metrics=metrics,
            recommendations=recommendations,
            confidence_score=confidence_score,
            confidence_explanation=confidence_explanation,
        )
