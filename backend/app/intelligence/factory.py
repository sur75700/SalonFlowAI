from app.intelligence.builders import IntelligenceBuilders
from app.intelligence.engine import IntelligenceEngine
from app.intelligence.service import IntelligenceService


def create_intelligence_service(
    *,
    builders: IntelligenceBuilders,
    engine: IntelligenceEngine | None = None,
) -> IntelligenceService:
    """Compose a validated pipeline and application service."""

    pipeline = builders.create_pipeline(engine=engine)

    return IntelligenceService(pipeline=pipeline)
