
from __future__ import annotations

import unittest
from unittest.mock import patch

from app.observability.exporters import (
    NoopMetricExporter,
    StructuredLogMetricExporter,
)
from app.observability.metrics import build_metric_record, emit_metric


class ExporterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.record = build_metric_record(
            name="intelligence_decision_total",
            kind="counter",
            value=1,
            dimensions={"outcome": "success"},
        )

    def test_noop_exporter(self) -> None:
        NoopMetricExporter().emit(self.record)

    def test_structured_log_shape(self) -> None:
        with self.assertLogs(
            "salonflow.observability.metrics",
            level="INFO",
        ) as captured:
            StructuredLogMetricExporter().emit(self.record)
        output = "\n".join(captured.output)
        self.assertIn("intelligence_decision_total", output)
        self.assertNotIn("owner_id", output)

    def test_emit_metric_is_fail_open(self) -> None:
        with patch(
            "app.observability.exporters.get_metric_exporter",
            side_effect=RuntimeError("exporter down"),
        ):
            emit_metric(self.record)


if __name__ == "__main__":
    unittest.main()
