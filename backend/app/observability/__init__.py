"""Privacy-safe observability foundation for SalonFlowAI."""

from app.observability.context import (
    bind_context,
    generate_context_id,
    get_correlation_id,
    get_decision_id,
    get_request_id,
    is_valid_context_id,
    reset_context,
)
from app.observability.events import (
    OBSERVABILITY_EVENT_NAMES,
    emit_observability_event,
    instrument_intelligence_decision,
)

__all__ = [
    "OBSERVABILITY_EVENT_NAMES",
    "bind_context",
    "emit_observability_event",
    "generate_context_id",
    "get_correlation_id",
    "get_decision_id",
    "get_request_id",
    "instrument_intelligence_decision",
    "is_valid_context_id",
    "reset_context",
]

# PHASE_62C4B_METRICS_EXPORTS
from app.observability.metrics import (
    DIMENSION_VALUES,
    FORBIDDEN_DIMENSIONS,
    METRIC_DIMENSIONS,
    MetricRecord,
    build_metric_record,
    emit_metric,
    instrument_decision,
    instrument_entitlement,
    instrument_execution,
    instrument_pipeline_stage,
    normalize_dimensions,
)
from app.observability.exporters import (
    MetricExporter,
    NoopMetricExporter,
    StructuredLogMetricExporter,
    get_metric_exporter,
)
