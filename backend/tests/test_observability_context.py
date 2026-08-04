from __future__ import annotations

import asyncio
import json

import pytest
from fastapi import HTTPException

from app.observability import events
from app.observability.context import (
    bind_context,
    generate_context_id,
    get_correlation_id,
    get_decision_id,
    get_request_id,
    is_valid_context_id,
    reset_context,
    resolve_correlation_id,
)


def test_context_id_contract() -> None:
    generated = generate_context_id()

    assert is_valid_context_id(generated)
    assert is_valid_context_id("trace-1.alpha_beta:gamma")
    assert not is_valid_context_id(None)
    assert not is_valid_context_id("")
    assert not is_valid_context_id("contains a space")
    assert not is_valid_context_id("x" * 129)


def test_invalid_correlation_id_is_replaced() -> None:
    assert resolve_correlation_id("valid-id") == "valid-id"

    replacement = resolve_correlation_id("invalid value")
    assert replacement != "invalid value"
    assert is_valid_context_id(replacement)


def test_context_bind_and_reset() -> None:
    assert get_request_id() is None
    assert get_correlation_id() is None
    assert get_decision_id() is None

    tokens = bind_context(
        request_id="request-1",
        correlation_id="correlation-1",
        decision_id="decision-1",
    )

    try:
        assert get_request_id() == "request-1"
        assert get_correlation_id() == "correlation-1"
        assert get_decision_id() == "decision-1"
    finally:
        reset_context(tokens)

    assert get_request_id() is None
    assert get_correlation_id() is None
    assert get_decision_id() is None


def test_decision_decorator_emits_started_and_completed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    records: list[dict[str, object]] = []

    monkeypatch.setattr(
        events.LOGGER,
        "info",
        lambda message: records.append(json.loads(message)),
    )

    @events.instrument_intelligence_decision
    async def route() -> dict[str, bool]:
        return {"ok": True}

    result = asyncio.run(route())

    assert result == {"ok": True}
    assert [record["event"] for record in records] == [
        "intelligence.decision.started",
        "intelligence.decision.completed",
    ]
    assert records[-1]["status_code"] == 200
    assert isinstance(records[-1]["duration_ms"], float)


def test_decision_decorator_preserves_denial(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    records: list[dict[str, object]] = []

    monkeypatch.setattr(
        events.LOGGER,
        "info",
        lambda message: records.append(json.loads(message)),
    )

    @events.instrument_intelligence_decision
    async def route() -> None:
        raise HTTPException(status_code=403, detail="unchanged")

    with pytest.raises(HTTPException) as captured:
        asyncio.run(route())

    assert captured.value.status_code == 403
    assert captured.value.detail == "unchanged"
    assert records[-1]["event"] == "intelligence.decision.denied"
    assert records[-1]["status_code"] == 403
