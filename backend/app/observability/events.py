"""Best-effort privacy-safe structured observability events."""

from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from functools import wraps
from typing import Any, ParamSpec, TypeVar

from fastapi import HTTPException
from starlette.responses import Response

from app.observability.context import (
    get_correlation_id,
    get_decision_id,
    get_request_id,
)
from app.observability.privacy import sanitize_mapping
from app.observability.timing import MonotonicTimer

P = ParamSpec("P")
R = TypeVar("R")

LOGGER = logging.getLogger("salonflow.observability")

OBSERVABILITY_EVENT_NAMES = frozenset(
    {
        "intelligence.decision.started",
        "intelligence.decision.completed",
        "intelligence.decision.denied",
        "intelligence.decision.failed",
        "intelligence.instrumentation.failed",
    }
)


def _base_payload(event_name: str) -> dict[str, Any]:
    return {
        "event": event_name,
        "timestamp": datetime.now(UTC).isoformat(),
        "request_id": get_request_id(),
        "correlation_id": get_correlation_id(),
        "decision_id": get_decision_id(),
    }


def _emit_instrumentation_failure(
    *,
    failed_event: str,
    failure_type: str,
) -> None:
    payload = _base_payload("intelligence.instrumentation.failed")
    payload.update(
        {
            "failed_event": failed_event,
            "failure_type": failure_type,
        }
    )

    try:
        LOGGER.warning(
            json.dumps(payload, sort_keys=True, separators=(",", ":"))
        )
    except Exception:
        # Observability must never change the product response path.
        return


def emit_observability_event(
    event_name: str,
    **fields: Any,
) -> bool:
    """Emit one bounded JSON event without exposing raw user data."""

    if event_name not in OBSERVABILITY_EVENT_NAMES:
        _emit_instrumentation_failure(
            failed_event=event_name,
            failure_type="invalid_event_name",
        )
        return False

    payload = _base_payload(event_name)
    payload.update(sanitize_mapping(fields))

    try:
        LOGGER.info(
            json.dumps(payload, sort_keys=True, separators=(",", ":"))
        )
    except Exception as exc:
        _emit_instrumentation_failure(
            failed_event=event_name,
            failure_type=type(exc).__name__,
        )
        return False

    return True


def instrument_intelligence_decision(
    function: Callable[P, Awaitable[R]],
) -> Callable[P, Awaitable[R]]:
    """Instrument an Intelligence route without changing its semantics."""

    @wraps(function)
    async def wrapped(*args: P.args, **kwargs: P.kwargs) -> R:
        timer = MonotonicTimer.start()
        emit_observability_event("intelligence.decision.started")

        try:
            result = await function(*args, **kwargs)
        except HTTPException as exc:
            event_name = (
                "intelligence.decision.denied"
                if exc.status_code in {401, 403}
                else "intelligence.decision.failed"
            )
            emit_observability_event(
                event_name,
                duration_ms=timer.elapsed_ms(),
                error_type=type(exc).__name__,
                status_code=exc.status_code,
            )
            raise
        except Exception as exc:
            emit_observability_event(
                "intelligence.decision.failed",
                duration_ms=timer.elapsed_ms(),
                error_type=type(exc).__name__,
                status_code=500,
            )
            raise

        status_code = (
            result.status_code
            if isinstance(result, Response)
            else 200
        )
        emit_observability_event(
            "intelligence.decision.completed",
            duration_ms=timer.elapsed_ms(),
            status_code=status_code,
        )
        return result

    return wrapped
