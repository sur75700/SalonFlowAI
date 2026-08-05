
from __future__ import annotations

import asyncio
import functools
import math
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Literal, Mapping, ParamSpec, TypeVar

MetricKind = Literal["counter", "duration_ms"]

METRIC_DIMENSIONS: dict[str, frozenset[str]] = {
    "intelligence_entitlement_check_total": frozenset(
        {"outcome", "reason_code"}
    ),
    "intelligence_entitlement_check_duration_ms": frozenset(
        {"outcome", "reason_code"}
    ),
    "intelligence_execution_total": frozenset(
        {"outcome", "source_kind"}
    ),
    "intelligence_execution_duration_ms": frozenset(
        {"outcome", "source_kind"}
    ),
    "intelligence_pipeline_stage_total": frozenset(
        {"stage", "outcome"}
    ),
    "intelligence_pipeline_stage_duration_ms": frozenset(
        {"stage", "outcome"}
    ),
    "intelligence_decision_total": frozenset({"outcome"}),
    "intelligence_decision_duration_ms": frozenset({"outcome"}),
}

DIMENSION_VALUES: dict[str, frozenset[str]] = {
    "outcome": frozenset(
        {
            "allowed",
            "denied",
            "error",
            "invalid",
            "skipped",
            "success",
            "unavailable",
            "unknown",
        }
    ),
    "reason_code": frozenset(
        {
            "allowed",
            "disabled",
            "expired",
            "missing",
            "not_entitled",
            "unknown",
        }
    ),
    "source_kind": frozenset({"trusted", "unknown"}),
    "stage": frozenset({"resolve", "unknown"}),
}

FORBIDDEN_DIMENSIONS = frozenset(
    {
        "authorization",
        "correlation_id",
        "decision_id",
        "email",
        "error_message",
        "exception",
        "owner_id",
        "path",
        "phone",
        "request_id",
        "salon_id",
        "stack",
        "token",
        "traceback",
        "url",
        "user_id",
    }
)

P = ParamSpec("P")
R = TypeVar("R")


@dataclass(frozen=True, slots=True)
class MetricRecord:
    name: str
    kind: MetricKind
    value: float
    dimensions: tuple[tuple[str, str], ...]
    timestamp: str


def _finite_non_negative(value: float | int) -> float:
    number = float(value)
    if not math.isfinite(number) or number < 0:
        raise ValueError("Metric value must be finite and non-negative")
    return min(number, 86_400_000.0)


def normalize_dimensions(
    metric_name: str,
    dimensions: Mapping[str, object],
) -> tuple[tuple[str, str], ...]:
    allowed = METRIC_DIMENSIONS.get(metric_name)
    if allowed is None:
        raise ValueError("Unknown metric name")

    keys = set(dimensions)
    if keys & FORBIDDEN_DIMENSIONS:
        raise ValueError("Forbidden high-cardinality metric dimension")
    if keys != set(allowed):
        raise ValueError("Metric dimensions do not match closed schema")

    normalized: list[tuple[str, str]] = []
    for key in sorted(allowed):
        raw = str(dimensions[key]).strip().lower()
        value = raw if raw in DIMENSION_VALUES[key] else "unknown"
        normalized.append((key, value))
    return tuple(normalized)


def build_metric_record(
    *,
    name: str,
    kind: MetricKind,
    value: float | int,
    dimensions: Mapping[str, object],
) -> MetricRecord:
    if kind not in {"counter", "duration_ms"}:
        raise ValueError("Unknown metric kind")
    if kind == "counter" and float(value) != 1.0:
        raise ValueError("Counter increments must equal one")
    return MetricRecord(
        name=name,
        kind=kind,
        value=_finite_non_negative(value),
        dimensions=normalize_dimensions(name, dimensions),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def emit_metric(record: MetricRecord) -> None:
    try:
        from app.observability.exporters import get_metric_exporter

        get_metric_exporter().emit(record)
    except Exception:
        return


def _emit_pair(
    *,
    base_name: str,
    duration_ms: float,
    dimensions: Mapping[str, object],
) -> None:
    try:
        emit_metric(
            build_metric_record(
                name=f"{base_name}_total",
                kind="counter",
                value=1,
                dimensions=dimensions,
            )
        )
        emit_metric(
            build_metric_record(
                name=f"{base_name}_duration_ms",
                kind="duration_ms",
                value=duration_ms,
                dimensions=dimensions,
            )
        )
    except Exception:
        return


def _classify_exception(exc: BaseException) -> str:
    name = exc.__class__.__name__.lower()
    text = str(exc).lower()
    if "unavailable" in name or "unavailable" in text:
        return "unavailable"
    if "validation" in name or "invalid" in text:
        return "invalid"
    if (
        "denied" in name
        or "forbidden" in name
        or "entitl" in name
        or "permission" in name
    ):
        return "denied"
    return "error"


def _entitlement_reason(outcome: str) -> str:
    if outcome == "allowed":
        return "allowed"
    if outcome == "denied":
        return "not_entitled"
    return "unknown"


def _decorate_timed(
    function: Any,
    *,
    base_name: str,
    dimensions_factory: Callable[[str], Mapping[str, object]],
    success_outcome: str,
    none_outcome: str | None,
    marker: str,
) -> Any:
    if asyncio.iscoroutinefunction(function):
        @functools.wraps(function)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
            started = time.perf_counter()
            outcome = success_outcome
            try:
                result = await function(*args, **kwargs)
                if result is None and none_outcome is not None:
                    outcome = none_outcome
                return result
            except Exception as exc:
                outcome = _classify_exception(exc)
                raise
            finally:
                _emit_pair(
                    base_name=base_name,
                    duration_ms=(time.perf_counter() - started) * 1000,
                    dimensions=dimensions_factory(outcome),
                )
        async_wrapper.__observability_instrumented__ = marker
        return async_wrapper

    @functools.wraps(function)
    def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
        started = time.perf_counter()
        outcome = success_outcome
        try:
            result = function(*args, **kwargs)
            if result is None and none_outcome is not None:
                outcome = none_outcome
            return result
        except Exception as exc:
            outcome = _classify_exception(exc)
            raise
        finally:
            _emit_pair(
                base_name=base_name,
                duration_ms=(time.perf_counter() - started) * 1000,
                dimensions=dimensions_factory(outcome),
            )
    sync_wrapper.__observability_instrumented__ = marker
    return sync_wrapper


def instrument_entitlement() -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorate(function: Any) -> Any:
        return _decorate_timed(
            function,
            base_name="intelligence_entitlement_check",
            dimensions_factory=lambda outcome: {
                "outcome": outcome,
                "reason_code": _entitlement_reason(outcome),
            },
            success_outcome="allowed",
            none_outcome=None,
            marker="entitlement",
        )
    return decorate


def instrument_execution(
    *,
    source_kind: str = "trusted",
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorate(function: Any) -> Any:
        return _decorate_timed(
            function,
            base_name="intelligence_execution",
            dimensions_factory=lambda outcome: {
                "outcome": outcome,
                "source_kind": source_kind,
            },
            success_outcome="success",
            none_outcome="unavailable",
            marker="execution",
        )
    return decorate


def instrument_pipeline_stage(
    *,
    stage: str,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorate(function: Any) -> Any:
        return _decorate_timed(
            function,
            base_name="intelligence_pipeline_stage",
            dimensions_factory=lambda outcome: {
                "stage": stage,
                "outcome": outcome,
            },
            success_outcome="success",
            none_outcome="skipped",
            marker=f"pipeline:{stage}",
        )
    return decorate


def instrument_decision() -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorate(function: Any) -> Any:
        return _decorate_timed(
            function,
            base_name="intelligence_decision",
            dimensions_factory=lambda outcome: {"outcome": outcome},
            success_outcome="success",
            none_outcome="unavailable",
            marker="decision",
        )
    return decorate
