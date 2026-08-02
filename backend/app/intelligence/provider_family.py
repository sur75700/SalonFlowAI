from dataclasses import dataclass

from app.intelligence.capacity import CapacityProvider
from app.intelligence.client_intelligence import ClientProvider
from app.intelligence.provider import AnalyticsProvider
from app.intelligence.service_intelligence import ServiceProvider


@dataclass(frozen=True, slots=True)
class IntelligenceProviderFamily:
    """
    Complete infrastructure-neutral provider set.

    This object composes the four trusted data arteries used by the
    intelligence layer without coupling domain contracts to MongoDB.

    Pipeline builders may consume one or more providers from this
    family while execution caching remains scoped by domain and
    provider identity.
    """

    revenue: AnalyticsProvider
    capacity: CapacityProvider
    client: ClientProvider
    service: ServiceProvider

    def __post_init__(self) -> None:
        checks = (
            (
                "revenue",
                self.revenue,
                AnalyticsProvider,
            ),
            (
                "capacity",
                self.capacity,
                CapacityProvider,
            ),
            (
                "client",
                self.client,
                ClientProvider,
            ),
            (
                "service",
                self.service,
                ServiceProvider,
            ),
        )

        for field_name, value, protocol in checks:
            if not isinstance(value, protocol):
                raise TypeError(
                    f"{field_name} must satisfy "
                    f"{protocol.__name__}"
                )
