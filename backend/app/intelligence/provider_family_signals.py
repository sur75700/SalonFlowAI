from dataclasses import dataclass

from app.intelligence.capacity_signals import (
    CapacitySignalBuilder,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import Signal
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.reasoning import prioritize_signals
from app.intelligence.revenue_signals import (
    RevenueSignalBuilder,
)


@dataclass(frozen=True, slots=True)
class ProviderFamilySignalBuilder:
    """
    Compose only domains with approved signal policies.

    Revenue and Capacity already have deterministic, tested thresholds.
    Client and Service remain metric-only until explicit business rules
    are approved instead of inventing arbitrary alert thresholds.
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
    ) -> tuple[Signal, ...]:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        revenue_signals = await RevenueSignalBuilder(
            provider=self.providers.revenue
        )(context)

        capacity_signals = await CapacitySignalBuilder(
            provider=self.providers.capacity
        )(context)

        return prioritize_signals(
            revenue_signals + capacity_signals
        )
