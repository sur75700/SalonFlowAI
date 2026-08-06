import inspect
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, replace
from typing import Protocol, runtime_checkable

from app.intelligence.capacity import (
    CAPACITY_BASELINE_METADATA_KEY,
    CapacityBaseline,
)
from app.intelligence.context import IntelligenceContext


CapacityBaselineResult = (
    CapacityBaseline
    | Awaitable[CapacityBaseline]
)

CapacityBaselineLoader = Callable[
    [IntelligenceContext],
    CapacityBaselineResult,
]


@runtime_checkable
class CapacityBaselineSource(Protocol):
    """
    Trusted source of staffed-capacity facts.

    Implementations may read a configuration store, schedule service or
    another authoritative source. Appointment history alone is not an
    acceptable capacity-baseline source.
    """

    def get_capacity_baseline(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacityBaselineResult:
        """Return the baseline for one authenticated analysis context."""


@dataclass(frozen=True, slots=True)
class ExplicitCapacityBaselineSource:
    """
    Source backed by one explicitly supplied trusted baseline.

    This adapter is useful for request-scoped configuration, controlled
    administrative inputs and deterministic integration tests.
    """

    baseline: CapacityBaseline

    def __post_init__(self) -> None:
        if not isinstance(
            self.baseline,
            CapacityBaseline,
        ):
            raise TypeError(
                "baseline must be a CapacityBaseline"
            )

    def get_capacity_baseline(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacityBaseline:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        return self.baseline


@dataclass(frozen=True, slots=True)
class CallableCapacityBaselineSource:
    """
    Adapter for a synchronous or asynchronous trusted baseline loader.

    A future Mongo schedule/configuration loader can implement the same
    contract without coupling the intelligence core to API or persistence
    details.
    """

    loader: CapacityBaselineLoader

    def __post_init__(self) -> None:
        if not callable(self.loader):
            raise TypeError(
                "loader must be callable"
            )

    def get_capacity_baseline(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacityBaselineResult:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        return self.loader(context)


def _require_context(
    context: IntelligenceContext,
) -> IntelligenceContext:
    if not isinstance(context, IntelligenceContext):
        raise TypeError(
            "context must be an IntelligenceContext"
        )

    return context


def _require_baseline(
    *,
    context: IntelligenceContext,
    baseline: CapacityBaseline,
) -> CapacityBaseline:
    if not isinstance(baseline, CapacityBaseline):
        raise TypeError(
            "capacity source must return a CapacityBaseline"
        )

    if baseline.owner_id != context.owner_id:
        raise RuntimeError(
            "capacity baseline owner does not match "
            "context owner"
        )

    return baseline


async def resolve_capacity_baseline(
    *,
    context: IntelligenceContext,
    source: CapacityBaselineSource,
) -> CapacityBaseline:
    """
    Resolve and validate one trusted capacity baseline.

    Both synchronous and asynchronous source implementations are
    supported. Authoritative blocked-period and holiday/closure evidence
    remains attached to the immutable baseline. Window-period validation
    remains enforced by the capacity provider when it consumes the
    prepared context.
    """

    context = _require_context(context)

    if not isinstance(source, CapacityBaselineSource):
        raise TypeError(
            "source must satisfy CapacityBaselineSource"
        )

    result = source.get_capacity_baseline(
        context=context
    )

    if inspect.isawaitable(result):
        result = await result

    return _require_baseline(
        context=context,
        baseline=result,
    )


def attach_capacity_baseline(
    *,
    context: IntelligenceContext,
    baseline: CapacityBaseline,
) -> IntelligenceContext:
    """
    Return a new context containing a validated baseline.

    The original context and its metadata dictionary remain unchanged.
    A different pre-existing baseline, including different authoritative
    fact counts, is rejected instead of silently replacing trusted
    execution input.
    """

    context = _require_context(context)

    baseline = _require_baseline(
        context=context,
        baseline=baseline,
    )

    existing = context.metadata.get(
        CAPACITY_BASELINE_METADATA_KEY
    )

    if existing is baseline or existing == baseline:
        return context

    if existing is not None:
        raise RuntimeError(
            "context already contains a different "
            "capacity baseline"
        )

    metadata = dict(context.metadata)

    metadata[
        CAPACITY_BASELINE_METADATA_KEY
    ] = baseline

    return replace(
        context,
        metadata=metadata,
    )


async def prepare_capacity_context(
    *,
    context: IntelligenceContext,
    source: CapacityBaselineSource,
) -> IntelligenceContext:
    """
    Resolve a trusted source and return a capacity-ready context.

    This is the intended integration seam for the future authenticated
    API/context builder.
    """

    baseline = await resolve_capacity_baseline(
        context=context,
        source=source,
    )

    return attach_capacity_baseline(
        context=context,
        baseline=baseline,
    )
