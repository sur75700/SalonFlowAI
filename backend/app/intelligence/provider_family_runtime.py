from dataclasses import dataclass

from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Metric,
    Recommendation,
    Signal,
)
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.provider_family_metrics import (
    ProviderFamilyMetricBuilder,
)
from app.intelligence.provider_family_recommendations import (
    ProviderFamilyRecommendationBuilder,
)
from app.intelligence.provider_family_signals import (
    ProviderFamilySignalBuilder,
)


TRUSTED_METRIC_DOMAINS = (
    "revenue",
    "capacity",
    "client",
    "service",
)


def _validate_signals(
    signals: tuple[Signal, ...],
) -> None:
    if not isinstance(signals, tuple):
        raise TypeError("signals must be a tuple")

    for signal in signals:
        if not isinstance(signal, Signal):
            raise TypeError(
                "signals must contain only Signal values"
            )


def _validate_metrics(
    metrics: tuple[Metric, ...],
) -> None:
    if not isinstance(metrics, tuple):
        raise TypeError("metrics must be a tuple")

    for metric in metrics:
        if not isinstance(metric, Metric):
            raise TypeError(
                "metrics must contain only Metric values"
            )


def _metric_domains(
    metrics: tuple[Metric, ...],
) -> tuple[str, ...]:
    _validate_metrics(metrics)

    return tuple(
        domain
        for domain in TRUSTED_METRIC_DOMAINS
        if any(
            metric.key.startswith(f"{domain}.")
            for metric in metrics
        )
    )


@dataclass(frozen=True, slots=True)
class ProviderFamilySummaryBuilder:
    """Create a deterministic cross-domain execution summary."""

    def __call__(
        self,
        context: IntelligenceContext,
        signals: tuple[Signal, ...],
        metrics: tuple[Metric, ...],
    ) -> str:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        _validate_signals(signals)
        domains = _metric_domains(metrics)

        domain_text = (
            ", ".join(domains)
            if domains
            else "none"
        )

        return (
            f"Analyzed {len(signals)} trusted signals "
            f"and {len(metrics)} validated metrics "
            f"across {len(domains)} trusted domains: "
            f"{domain_text}."
        )


@dataclass(frozen=True, slots=True)
class ProviderFamilyConfidenceBuilder:
    """
    Measure validated domain coverage, not predictive certainty.

    The score represents the fraction of trusted metric domains present
    in the completed execution. It does not claim future outcome accuracy.
    """

    def __call__(
        self,
        context: IntelligenceContext,
        signals: tuple[Signal, ...],
        metrics: tuple[Metric, ...],
        recommendations: tuple[Recommendation, ...],
    ) -> tuple[float, str]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        _validate_signals(signals)
        domains = _metric_domains(metrics)

        if not isinstance(recommendations, tuple):
            raise TypeError(
                "recommendations must be a tuple"
            )

        for recommendation in recommendations:
            if not isinstance(
                recommendation,
                Recommendation,
            ):
                raise TypeError(
                    "recommendations must contain only "
                    "Recommendation values"
                )

        score = round(
            len(domains)
            / len(TRUSTED_METRIC_DOMAINS),
            2,
        )

        domain_text = (
            ", ".join(domains)
            if domains
            else "none"
        )

        explanation = (
            "Validated metric coverage includes "
            f"{len(domains)} of "
            f"{len(TRUSTED_METRIC_DOMAINS)} "
            f"trusted domains: {domain_text}. "
            "This score measures data-domain coverage, "
            "not predictive certainty."
        )

        return score, explanation


def create_provider_family_builders(
    *,
    providers: IntelligenceProviderFamily,
) -> IntelligenceBuilders:
    """Compose the complete generic pipeline builder bundle."""

    if not isinstance(
        providers,
        IntelligenceProviderFamily,
    ):
        raise TypeError(
            "providers must be an "
            "IntelligenceProviderFamily"
        )

    return IntelligenceBuilders(
        signal_builder=ProviderFamilySignalBuilder(
            providers=providers
        ),
        metric_builder=ProviderFamilyMetricBuilder(
            providers=providers
        ),
        recommendation_builder=(
            ProviderFamilyRecommendationBuilder()
        ),
        summary_builder=ProviderFamilySummaryBuilder(),
        confidence_builder=(
            ProviderFamilyConfidenceBuilder()
        ),
    )
