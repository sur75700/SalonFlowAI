from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class SignalSeverity(StrEnum):
    INFO = "info"
    OPPORTUNITY = "opportunity"
    WARNING = "warning"
    CRITICAL = "critical"


class ConfidenceLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True, slots=True)
class Evidence:
    source: str
    description: str
    value: Any | None = None
    observed_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(frozen=True, slots=True)
class Signal:
    code: str
    title: str
    description: str
    severity: SignalSeverity
    evidence: tuple[Evidence, ...] = ()


@dataclass(frozen=True, slots=True)
class Metric:
    key: str
    label: str
    value: float
    unit: str | None = None
    comparison_value: float | None = None


@dataclass(frozen=True, slots=True)
class Confidence:
    score: float
    level: ConfidenceLevel
    explanation: str
    evidence_count: int = 0


@dataclass(frozen=True, slots=True)
class ExpectedImpact:
    metric: str
    estimated_change: float
    unit: str
    timeframe_days: int


@dataclass(frozen=True, slots=True)
class Recommendation:
    code: str
    title: str
    description: str
    priority: int
    expected_impacts: tuple[ExpectedImpact, ...] = ()


@dataclass(frozen=True, slots=True)
class IntelligenceDecision:
    owner_id: str
    summary: str
    signals: tuple[Signal, ...]
    metrics: tuple[Metric, ...]
    recommendations: tuple[Recommendation, ...]
    confidence: Confidence
    generated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
