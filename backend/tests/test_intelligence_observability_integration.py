
from __future__ import annotations

import asyncio
import unittest
from unittest.mock import patch

from app.observability.metrics import (
    instrument_decision,
    instrument_entitlement,
    instrument_execution,
    instrument_pipeline_stage,
)


class InstrumentationIntegrationTests(unittest.TestCase):
    def test_entitlement_exception_identity_and_pair(self) -> None:
        error = RuntimeError("denied")

        @instrument_entitlement()
        def subject() -> None:
            raise error

        with patch("app.observability.metrics.emit_metric") as emit:
            with self.assertRaises(RuntimeError) as captured:
                subject()
        self.assertIs(captured.exception, error)
        self.assertEqual(emit.call_count, 2)

    def test_execution_async_pair(self) -> None:
        @instrument_execution(source_kind="trusted")
        async def subject() -> object:
            return object()

        with patch("app.observability.metrics.emit_metric") as emit:
            asyncio.run(subject())
        self.assertEqual(emit.call_count, 2)

    def test_pipeline_skipped_pair(self) -> None:
        @instrument_pipeline_stage(stage="resolve")
        def subject() -> None:
            return None

        with patch("app.observability.metrics.emit_metric") as emit:
            subject()
        self.assertEqual(emit.call_count, 2)

    def test_decision_pair(self) -> None:
        @instrument_decision()
        def subject() -> object:
            return object()

        with patch("app.observability.metrics.emit_metric") as emit:
            subject()
        self.assertEqual(emit.call_count, 2)

    def test_export_failure_cannot_change_result(self) -> None:
        @instrument_execution()
        def subject() -> int:
            return 7

        with patch(
            "app.observability.metrics.emit_metric",
            side_effect=RuntimeError("down"),
        ):
            self.assertEqual(subject(), 7)


if __name__ == "__main__":
    unittest.main()
