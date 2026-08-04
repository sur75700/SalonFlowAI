from __future__ import annotations

import asyncio
from collections.abc import Sequence
from typing import Any

from starlette.types import Message, Receive, Scope, Send

from app.middleware.request_context import (
    CORRELATION_ID_HEADER,
    DECISION_ID_HEADER,
    REQUEST_ID_HEADER,
    RequestContextMiddleware,
)
from app.observability.context import (
    get_correlation_id,
    get_decision_id,
    get_request_id,
    is_valid_context_id,
)


async def _invoke(
    headers: Sequence[tuple[bytes, bytes]] = (),
) -> tuple[dict[str, str], dict[str, str | None]]:
    observed: dict[str, str | None] = {}

    async def app(scope: Scope, receive: Receive, send: Send) -> None:
        observed.update(
            {
                "request_id": get_request_id(),
                "correlation_id": get_correlation_id(),
                "decision_id": get_decision_id(),
            }
        )
        await send(
            {
                "type": "http.response.start",
                "status": 204,
                "headers": [],
            }
        )
        await send(
            {
                "type": "http.response.body",
                "body": b"",
                "more_body": False,
            }
        )

    middleware = RequestContextMiddleware(app)
    sent: list[Message] = []

    scope: Scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/test",
        "raw_path": b"/test",
        "query_string": b"",
        "root_path": "",
        "headers": list(headers),
        "client": ("127.0.0.1", 12345),
        "server": ("127.0.0.1", 8000),
        "state": {},
    }

    async def receive() -> Message:
        return {
            "type": "http.request",
            "body": b"",
            "more_body": False,
        }

    async def send(message: Message) -> None:
        sent.append(message)

    await middleware(scope, receive, send)

    response_start = next(
        message
        for message in sent
        if message["type"] == "http.response.start"
    )
    response_headers = {
        key.decode("latin-1").lower(): value.decode("latin-1")
        for key, value in response_start["headers"]
    }

    return response_headers, observed


def test_middleware_binds_and_returns_context_headers() -> None:
    response_headers, observed = asyncio.run(_invoke())

    request_id = response_headers[REQUEST_ID_HEADER.lower()]
    correlation_id = response_headers[CORRELATION_ID_HEADER.lower()]
    decision_id = response_headers[DECISION_ID_HEADER.lower()]

    assert is_valid_context_id(request_id)
    assert is_valid_context_id(correlation_id)
    assert is_valid_context_id(decision_id)
    assert observed == {
        "request_id": request_id,
        "correlation_id": correlation_id,
        "decision_id": decision_id,
    }

    assert get_request_id() is None
    assert get_correlation_id() is None
    assert get_decision_id() is None


def test_valid_incoming_correlation_id_is_preserved() -> None:
    response_headers, observed = asyncio.run(
        _invoke([(b"x-correlation-id", b"client-trace:123")])
    )

    assert (
        response_headers[CORRELATION_ID_HEADER.lower()]
        == "client-trace:123"
    )
    assert observed["correlation_id"] == "client-trace:123"


def test_invalid_incoming_correlation_id_is_replaced() -> None:
    response_headers, observed = asyncio.run(
        _invoke([(b"x-correlation-id", b"unsafe value")])
    )

    correlation_id = response_headers[CORRELATION_ID_HEADER.lower()]
    assert correlation_id != "unsafe value"
    assert is_valid_context_id(correlation_id)
    assert observed["correlation_id"] == correlation_id
