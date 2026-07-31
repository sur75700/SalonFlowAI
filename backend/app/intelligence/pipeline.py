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

    def run(
        self,
        *,
        context: IntelligenceContext,
    ) -> IntelligenceDecision:
        execution_context = create_execution_context(context)

        signals = validate_signals(
            self._signal_builder(execution_context)
        )
        metrics = validate_metrics(
            self._metric_builder(execution_context)
        )

        recommendations = validate_recommendations(
            self._recommendation_builder(
                execution_context,
                signals,
                metrics,
            )
        )

        summary = validate_summary(
            self._summary_builder(
                execution_context,
                signals,
                metrics,
            )
        )

        confidence_score, confidence_explanation = (
            validate_confidence_input(
                *self._confidence_builder(
                    execution_context,
                    signals,
                    metrics,
                    recommendations,
                )
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
