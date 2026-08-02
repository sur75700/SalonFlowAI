from collections.abc import Mapping
from datetime import UTC, datetime
from enum import Enum
import math
from typing import Any

from app.intelligence.contracts import (
    Confidence,
    ConfidenceLevel,
    Evidence,
    ExpectedImpact,
    IntelligenceDecision,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)


def _require_instance(
    value: object,
    expected_type: type,
    *,
    path: str,
):
    if not isinstance(value, expected_type):
        type_name = expected_type.__name__
        article = (
            "an"
            if type_name[:1].lower() in "aeiou"
            else "a"
        )

        raise TypeError(
            f"{path} must be {article} "
            f"{type_name}"
        )

    return value


def _text(
    value: object,
    *,
    path: str,
) -> str:
    if not isinstance(value, str):
        raise TypeError(
            f"{path} must be a string"
        )

    return value


def _integer(
    value: object,
    *,
    path: str,
) -> int:
    if isinstance(value, bool) or not isinstance(
        value,
        int,
    ):
        raise TypeError(
            f"{path} must be an integer"
        )

    return value


def _number(
    value: object,
    *,
    path: str,
) -> float:
    if isinstance(value, bool) or not isinstance(
        value,
        (int, float),
    ):
        raise TypeError(
            f"{path} must be numeric"
        )

    normalized = float(value)

    if not math.isfinite(normalized):
        raise ValueError(
            f"{path} must be finite"
        )

    return normalized


def _utc_isoformat(
    value: object,
    *,
    path: str,
) -> str:
    if not isinstance(value, datetime):
        raise TypeError(
            f"{path} must be a datetime"
        )

    if (
        value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise ValueError(
            f"{path} must be timezone-aware"
        )

    return value.astimezone(UTC).isoformat()


def _tuple(
    value: object,
    *,
    path: str,
) -> tuple:
    if not isinstance(value, tuple):
        raise TypeError(
            f"{path} must be a tuple"
        )

    return value


def _json_value(
    value: Any,
    *,
    path: str,
) -> Any:
    """
    Encode evidence payload values into strict JSON-compatible data.

    Supported values are JSON primitives, timezone-aware datetimes,
    Enum values, string-keyed mappings, tuples and lists. Sets,
    arbitrary objects and non-finite floating-point values fail closed.
    """

    if isinstance(value, Enum):
        return _json_value(
            value.value,
            path=path,
        )

    if isinstance(value, datetime):
        return _utc_isoformat(
            value,
            path=path,
        )

    if value is None:
        return None

    if isinstance(value, (str, bool, int)):
        return value

    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError(
                f"{path} must contain only finite numbers"
            )

        return value

    if isinstance(value, Mapping):
        keys = tuple(value.keys())

        for key in keys:
            if not isinstance(key, str):
                raise TypeError(
                    f"{path} mapping keys must be strings"
                )

        return {
            str(key): _json_value(
                value[key],
                path=f"{path}.{key}",
            )
            for key in sorted(keys, key=str)
        }

    if isinstance(value, (tuple, list)):
        return [
            _json_value(
                item,
                path=f"{path}[{index}]",
            )
            for index, item in enumerate(value)
        ]

    raise TypeError(
        f"{path} contains unsupported value type: "
        f"{type(value).__name__}"
    )


def _serialize_evidence(
    evidence: Evidence,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        evidence,
        Evidence,
        path=path,
    )

    return {
        "source": _text(
            evidence.source,
            path=f"{path}.source",
        ),
        "description": _text(
            evidence.description,
            path=f"{path}.description",
        ),
        "value": _json_value(
            evidence.value,
            path=f"{path}.value",
        ),
        "observed_at": _utc_isoformat(
            evidence.observed_at,
            path=f"{path}.observed_at",
        ),
    }


def _serialize_signal(
    signal: Signal,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        signal,
        Signal,
        path=path,
    )

    if not isinstance(
        signal.severity,
        SignalSeverity,
    ):
        raise TypeError(
            f"{path}.severity must be a SignalSeverity"
        )

    evidence = _tuple(
        signal.evidence,
        path=f"{path}.evidence",
    )

    return {
        "code": _text(
            signal.code,
            path=f"{path}.code",
        ),
        "title": _text(
            signal.title,
            path=f"{path}.title",
        ),
        "description": _text(
            signal.description,
            path=f"{path}.description",
        ),
        "severity": signal.severity.value,
        "evidence": [
            _serialize_evidence(
                item,
                path=f"{path}.evidence[{index}]",
            )
            for index, item in enumerate(evidence)
        ],
    }


def _serialize_metric(
    metric: Metric,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        metric,
        Metric,
        path=path,
    )

    comparison_value = (
        None
        if metric.comparison_value is None
        else _number(
            metric.comparison_value,
            path=f"{path}.comparison_value",
        )
    )

    return {
        "key": _text(
            metric.key,
            path=f"{path}.key",
        ),
        "label": _text(
            metric.label,
            path=f"{path}.label",
        ),
        "value": _number(
            metric.value,
            path=f"{path}.value",
        ),
        "unit": (
            None
            if metric.unit is None
            else _text(
                metric.unit,
                path=f"{path}.unit",
            )
        ),
        "comparison_value": comparison_value,
    }


def _serialize_expected_impact(
    impact: ExpectedImpact,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        impact,
        ExpectedImpact,
        path=path,
    )

    return {
        "metric": _text(
            impact.metric,
            path=f"{path}.metric",
        ),
        "estimated_change": _number(
            impact.estimated_change,
            path=f"{path}.estimated_change",
        ),
        "unit": _text(
            impact.unit,
            path=f"{path}.unit",
        ),
        "timeframe_days": _integer(
            impact.timeframe_days,
            path=f"{path}.timeframe_days",
        ),
    }


def _serialize_recommendation(
    recommendation: Recommendation,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        recommendation,
        Recommendation,
        path=path,
    )

    impacts = _tuple(
        recommendation.expected_impacts,
        path=f"{path}.expected_impacts",
    )

    return {
        "code": _text(
            recommendation.code,
            path=f"{path}.code",
        ),
        "title": _text(
            recommendation.title,
            path=f"{path}.title",
        ),
        "description": _text(
            recommendation.description,
            path=f"{path}.description",
        ),
        "priority": _integer(
            recommendation.priority,
            path=f"{path}.priority",
        ),
        "expected_impacts": [
            _serialize_expected_impact(
                impact,
                path=(
                    f"{path}.expected_impacts"
                    f"[{index}]"
                ),
            )
            for index, impact in enumerate(impacts)
        ],
    }


def _serialize_confidence(
    confidence: Confidence,
    *,
    path: str,
) -> dict[str, Any]:
    _require_instance(
        confidence,
        Confidence,
        path=path,
    )

    if not isinstance(
        confidence.level,
        ConfidenceLevel,
    ):
        raise TypeError(
            f"{path}.level must be a ConfidenceLevel"
        )

    return {
        "score": _number(
            confidence.score,
            path=f"{path}.score",
        ),
        "level": confidence.level.value,
        "explanation": _text(
            confidence.explanation,
            path=f"{path}.explanation",
        ),
        "evidence_count": _integer(
            confidence.evidence_count,
            path=f"{path}.evidence_count",
        ),
    }


def serialize_intelligence_decision(
    decision: IntelligenceDecision,
    *,
    expected_owner_id: str | None = None,
) -> dict[str, Any]:
    """
    Convert one tenant-bound decision into the external JSON contract.

    Domain dataclasses remain independent from FastAPI and Pydantic.
    When expected_owner_id is provided by an authenticated caller, a
    cross-tenant decision is rejected before any payload is returned.
    """

    _require_instance(
        decision,
        IntelligenceDecision,
        path="decision",
    )

    owner_id = _text(
        decision.owner_id,
        path="decision.owner_id",
    )

    if not owner_id.strip():
        raise ValueError(
            "decision.owner_id is required"
        )

    if expected_owner_id is not None:
        expected_owner_id = _text(
            expected_owner_id,
            path="expected_owner_id",
        )

        if not expected_owner_id.strip():
            raise ValueError(
                "expected_owner_id is required"
            )

        if owner_id != expected_owner_id:
            raise RuntimeError(
                "decision owner does not match "
                "expected owner"
            )

    signals = _tuple(
        decision.signals,
        path="decision.signals",
    )

    metrics = _tuple(
        decision.metrics,
        path="decision.metrics",
    )

    recommendations = _tuple(
        decision.recommendations,
        path="decision.recommendations",
    )

    return {
        "owner_id": owner_id,
        "summary": _text(
            decision.summary,
            path="decision.summary",
        ),
        "signals": [
            _serialize_signal(
                signal,
                path=f"decision.signals[{index}]",
            )
            for index, signal in enumerate(signals)
        ],
        "metrics": [
            _serialize_metric(
                metric,
                path=f"decision.metrics[{index}]",
            )
            for index, metric in enumerate(metrics)
        ],
        "recommendations": [
            _serialize_recommendation(
                recommendation,
                path=(
                    "decision.recommendations"
                    f"[{index}]"
                ),
            )
            for index, recommendation in enumerate(
                recommendations
            )
        ],
        "confidence": _serialize_confidence(
            decision.confidence,
            path="decision.confidence",
        ),
        "generated_at": _utc_isoformat(
            decision.generated_at,
            path="decision.generated_at",
        ),
    }
