
from __future__ import annotations

import math
import unittest

from app.observability.metrics import (
    FORBIDDEN_DIMENSIONS,
    METRIC_DIMENSIONS,
    build_metric_record,
    normalize_dimensions,
)


class MetricSchemaTests(unittest.TestCase):
    def test_closed_metric_catalog(self) -> None:
        self.assertEqual(len(METRIC_DIMENSIONS), 8)
        self.assertIn("intelligence_decision_total", METRIC_DIMENSIONS)

    def test_execution_schema(self) -> None:
        record = build_metric_record(
            name="intelligence_execution_total",
            kind="counter",
            value=1,
            dimensions={
                "outcome": "success",
                "source_kind": "trusted",
            },
        )
        self.assertEqual(dict(record.dimensions)["source_kind"], "trusted")

    def test_unknown_dimension_value_is_bounded(self) -> None:
        dimensions = normalize_dimensions(
            "intelligence_pipeline_stage_total",
            {"stage": "dynamic", "outcome": "success"},
        )
        self.assertEqual(dict(dimensions)["stage"], "unknown")

    def test_high_cardinality_dimensions_are_rejected(self) -> None:
        for key in FORBIDDEN_DIMENSIONS:
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    normalize_dimensions(
                        "intelligence_pipeline_stage_total",
                        {
                            "stage": "resolve",
                            "outcome": "success",
                            key: "secret",
                        },
                    )

    def test_non_finite_and_negative_values_are_rejected(self) -> None:
        for value in (-1, math.inf, math.nan):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    build_metric_record(
                        name="intelligence_execution_duration_ms",
                        kind="duration_ms",
                        value=value,
                        dimensions={
                            "outcome": "success",
                            "source_kind": "trusted",
                        },
                    )


if __name__ == "__main__":
    unittest.main()
