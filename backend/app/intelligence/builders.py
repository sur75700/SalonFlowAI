from dataclasses import dataclass

from app.intelligence.engine import IntelligenceEngine
from app.intelligence.pipeline import (
    ConfidenceBuilder,
    IntelligencePipeline,
    MetricBuilder,
    RecommendationBuilder,
    SignalBuilder,
    SummaryBuilder,
)


@dataclass(frozen=True, slots=True)
class IntelligenceBuilders:
    signal_builder: SignalBuilder
    metric_builder: MetricBuilder
    recommendation_builder: RecommendationBuilder
    summary_builder: SummaryBuilder
    confidence_builder: ConfidenceBuilder

    def __post_init__(self) -> None:
        fields = (
            ("signal_builder", self.signal_builder),
            ("metric_builder", self.metric_builder),
            (
                "recommendation_builder",
                self.recommendation_builder,
            ),
            ("summary_builder", self.summary_builder),
            ("confidence_builder", self.confidence_builder),
        )

        for field_name, builder in fields:
            if not callable(builder):
                raise TypeError(
                    f"{field_name} must be callable"
                )

    def create_pipeline(
        self,
        *,
        engine: IntelligenceEngine | None = None,
    ) -> IntelligencePipeline:
        return IntelligencePipeline(
            signal_builder=self.signal_builder,
            metric_builder=self.metric_builder,
            recommendation_builder=(
                self.recommendation_builder
            ),
            summary_builder=self.summary_builder,
            confidence_builder=self.confidence_builder,
            engine=engine,
        )
