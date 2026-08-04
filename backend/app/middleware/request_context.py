"""ASGI middleware for trusted request/correlation/decision identity."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.observability.context import (
    bind_context,
    generate_context_id,
    reset_context,
    resolve_correlation_id,
)

REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"
DECISION_ID_HEADER = "X-Decision-ID"


class RequestContextMiddleware:
    """Bind server-trusted context and expose it in response headers."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming_headers = Headers(scope=scope)
        request_id = generate_context_id()
        correlation_id = resolve_correlation_id(
            incoming_headers.get(CORRELATION_ID_HEADER)
        )
        decision_id = generate_context_id()

        tokens = bind_context(
            request_id=request_id,
            correlation_id=correlation_id,
            decision_id=decision_id,
        )

        async def send_with_context(message: Message) -> None:
            if message["type"] == "http.response.start":
                response_headers = MutableHeaders(scope=message)
                response_headers[REQUEST_ID_HEADER] = request_id
                response_headers[CORRELATION_ID_HEADER] = correlation_id
                response_headers[DECISION_ID_HEADER] = decision_id

            await send(message)

        try:
            await self.app(scope, receive, send_with_context)
        finally:
            reset_context(tokens)
