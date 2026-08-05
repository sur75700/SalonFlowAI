
from __future__ import annotations

import json
import logging
from typing import Protocol

from app.observability.metrics import MetricRecord

_LOGGER = logging.getLogger("salonflow.observability.metrics")


class MetricExporter(Protocol):
    def emit(self, record: MetricRecord) -> None: ...


class NoopMetricExporter:
    def emit(self, record: MetricRecord) -> None:
        del record


class StructuredLogMetricExporter:
    def emit(self, record: MetricRecord) -> None:
        payload = {
            "dimensions": dict(record.dimensions),
            "kind": record.kind,
            "metric": record.name,
            "timestamp": record.timestamp,
            "value": record.value,
        }
        _LOGGER.info(
            "intelligence.metric %s",
            json.dumps(payload, sort_keys=True, separators=(",", ":")),
        )


_NOOP = NoopMetricExporter()
_STRUCTURED = StructuredLogMetricExporter()


def get_metric_exporter() -> MetricExporter:
    try:
        from app.core.config import (
            intelligence_metrics_enabled,
            intelligence_metrics_exporter,
        )

        if not intelligence_metrics_enabled():
            return _NOOP
        if intelligence_metrics_exporter() == "structured_log":
            return _STRUCTURED
    except Exception:
        return _NOOP
    return _NOOP
