"""Monotonic timing primitives for request-boundary instrumentation."""

from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MonotonicTimer:
    started_at: float

    @classmethod
    def start(cls) -> "MonotonicTimer":
        return cls(started_at=time.perf_counter())

    def elapsed_ms(self) -> float:
        elapsed = max(0.0, time.perf_counter() - self.started_at)
        return round(elapsed * 1000.0, 3)
