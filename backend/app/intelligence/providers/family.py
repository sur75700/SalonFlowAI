from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.providers.mongo_capacity_provider import (
    MongoCapacityProvider,
)
from app.intelligence.providers.mongo_client_provider import (
    MongoClientProvider,
)
from app.intelligence.providers.mongo_revenue_provider import (
    MongoRevenueProvider,
)
from app.intelligence.providers.mongo_service_provider import (
    MongoServiceProvider,
)


def create_mongo_provider_family(
) -> IntelligenceProviderFamily:
    """
    Create an isolated production Mongo provider family.

    Fresh provider instances are returned for each composition call.
    Providers remain stateless; execution-scoped snapshot caching is
    owned by the IntelligenceContext execution copy.
    """

    return IntelligenceProviderFamily(
        revenue=MongoRevenueProvider(),
        capacity=MongoCapacityProvider(),
        client=MongoClientProvider(),
        service=MongoServiceProvider(),
    )
