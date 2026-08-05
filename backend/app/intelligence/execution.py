from app.observability.metrics import instrument_execution
from collections.abc import Callable
import inspect
from dataclasses import replace
from typing import TypeVar, cast

from app.intelligence.context import IntelligenceContext


SnapshotT = TypeVar("SnapshotT")
_EXECUTION_CACHE_KEY = "__salonflow_intelligence_execution_snapshots__"


def create_execution_context(
    context: IntelligenceContext,
) -> IntelligenceContext:
    """
    Create an isolated context for one intelligence pipeline execution.

    The original context and its metadata remain untouched. Snapshot state is
    discarded when the execution context falls out of scope.
    """

    if not isinstance(context, IntelligenceContext):
        raise TypeError("context must be an IntelligenceContext")

    metadata = dict(context.metadata)
    metadata[_EXECUTION_CACHE_KEY] = {}

    return replace(
        context,
        metadata=metadata,
    )


@instrument_execution(source_kind="trusted")
async def get_execution_snapshot(
    *,
    context: IntelligenceContext,
    domain: str,
    provider: object,
    loader: Callable[[], SnapshotT | object],
) -> SnapshotT:
    """
    Load a provider snapshot once for a domain/provider pair per execution.

    Cache ownership belongs exclusively to the execution context created by
    create_execution_context(). No state is stored globally or on providers.
    """

    if not isinstance(context, IntelligenceContext):
        raise TypeError("context must be an IntelligenceContext")

    normalized_domain = domain.strip()

    if not normalized_domain:
        raise ValueError("domain is required")

    if not callable(loader):
        raise TypeError("loader must be callable")

    cache_object = context.metadata.get(_EXECUTION_CACHE_KEY)

    if not isinstance(cache_object, dict):
        result = loader()

        if inspect.isawaitable(result):
            result = await result

        return cast(SnapshotT, result)

    cache = cast(dict[tuple[str, int], object], cache_object)
    cache_key = (normalized_domain, id(provider))

    if cache_key not in cache:
        result = loader()

        if inspect.isawaitable(result):
            result = await result

        cache[cache_key] = result

    return cast(SnapshotT, cache[cache_key])
