from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.engine import IntelligenceEngine
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.provider_family_runtime import (
    create_provider_family_builders,
)
from app.intelligence.providers import (
    create_mongo_provider_family,
)
from app.intelligence.service import IntelligenceService


def create_intelligence_service(
    *,
    builders: IntelligenceBuilders,
    engine: IntelligenceEngine | None = None,
) -> IntelligenceService:
    """Compose a validated pipeline and application service."""

    pipeline = builders.create_pipeline(
        engine=engine
    )

    return IntelligenceService(
        pipeline=pipeline
    )


def create_provider_family_intelligence_service(
    *,
    providers: IntelligenceProviderFamily | None = None,
    engine: IntelligenceEngine | None = None,
) -> IntelligenceService:
    """
    Compose the complete provider-family intelligence service.

    When providers are omitted, fresh stateless Mongo providers are used.
    No database access occurs during construction; providers load facts
    only when IntelligenceService.analyze() executes.

    Capacity analysis remains fail-closed and requires a trusted
    CapacityBaseline in IntelligenceContext.metadata. The baseline keeps
    authoritative blocked-period and holiday/closure evidence separate
    from appointment occupancy.
    """

    selected_providers = (
        providers
        if providers is not None
        else create_mongo_provider_family()
    )

    builders = create_provider_family_builders(
        providers=selected_providers
    )

    return create_intelligence_service(
        builders=builders,
        engine=engine,
    )
