"""Request-scoped observability identity stored in ContextVars."""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar, Token
from dataclasses import dataclass

_CONTEXT_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

_request_id_var: ContextVar[str | None] = ContextVar(
    "salonflow_request_id",
    default=None,
)
_correlation_id_var: ContextVar[str | None] = ContextVar(
    "salonflow_correlation_id",
    default=None,
)
_decision_id_var: ContextVar[str | None] = ContextVar(
    "salonflow_decision_id",
    default=None,
)


@dataclass(frozen=True, slots=True)
class ContextTokens:
    """Tokens required to restore the previous request context."""

    request_id: Token[str | None]
    correlation_id: Token[str | None]
    decision_id: Token[str | None]


def generate_context_id() -> str:
    """Return a server-generated identifier allowed by the public contract."""

    return uuid.uuid4().hex


def is_valid_context_id(value: str | None) -> bool:
    """Return whether an incoming context identifier is contract-safe."""

    return bool(value and _CONTEXT_ID_PATTERN.fullmatch(value))


def resolve_correlation_id(incoming: str | None) -> str:
    """Preserve a valid incoming correlation ID or generate a safe one."""

    if is_valid_context_id(incoming):
        return incoming
    return generate_context_id()


def bind_context(
    *,
    request_id: str,
    correlation_id: str,
    decision_id: str,
) -> ContextTokens:
    """Bind IDs to the current async context and return reset tokens."""

    return ContextTokens(
        request_id=_request_id_var.set(request_id),
        correlation_id=_correlation_id_var.set(correlation_id),
        decision_id=_decision_id_var.set(decision_id),
    )


def reset_context(tokens: ContextTokens) -> None:
    """Restore the previous async context."""

    _decision_id_var.reset(tokens.decision_id)
    _correlation_id_var.reset(tokens.correlation_id)
    _request_id_var.reset(tokens.request_id)


def get_request_id() -> str | None:
    return _request_id_var.get()


def get_correlation_id() -> str | None:
    return _correlation_id_var.get()


def get_decision_id() -> str | None:
    return _decision_id_var.get()
