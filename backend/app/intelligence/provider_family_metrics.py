from dataclasses import dataclass

from app.intelligence.capacity import (
    CapacityMetricBuilder,
)
from app.intelligence.client_intelligence import (
    ClientMetricBuilder,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import Metric
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.revenue import RevenueMetricBuilder
from app.intelligence.service_intelligence import (
    ServiceMetricBuilder,
)


@dataclass(frozen=True, slots=True)
class ProviderFamilyMetricBuilder:
    """
    Compose Revenue, Capacity, Client and Service metrics.

    Each domain builder shares the same execution context, allowing
    get_execution_snapshot() to load every provider/domain pair once
    per intelligence execution.
    """

    providers: IntelligenceProviderFamily

    def __post_init__(self) -> None:
        if not isinstance(
            self.providers,
            IntelligenceProviderFamily,
        ):
            raise TypeError(
                "providers must be an "
                "IntelligenceProviderFamily"
            )

    async def __call__(
        self,
        context: IntelligenceContext,
    ) -> tuple[Metric, ...]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        revenue_metrics = await RevenueMetricBuilder(
            provider=self.providers.revenue
        )(context)

        capacity_metrics = await CapacityMetricBuilder(
            provider=self.providers.capacity
        )(context)

        client_metrics = await ClientMetricBuilder(
            provider=self.providers.client
        )(context)

        service_metrics = await ServiceMetricBuilder(
            provider=self.providers.service
        )(context)

        return (
            revenue_metrics
            + capacity_metrics
            + client_metrics
            + service_metrics
        )
