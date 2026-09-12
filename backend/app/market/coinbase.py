from __future__ import annotations

from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
import math
from typing import Any

import requests

from app.market.contracts import (
    MarketAssetClass,
    MarketChangeType,
    MarketQuote,
    MarketQuoteState,
)


COINBASE_ENDPOINT = (
    "https://api.coinbase.com/api/v3/brokerage/market/products/BTC-USD"
)
COINBASE_TIMEOUT_SECONDS = 5.0


class CoinbaseProviderError(RuntimeError):
    """Raised when Coinbase public market data cannot be trusted."""


class CoinbasePayloadError(CoinbaseProviderError):
    """Raised when Coinbase returns malformed BTC/USD market data."""


def _strict_number(
    value: object,
    *,
    field: str,
    positive: bool = False,
    percent: bool = False,
) -> float:
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        raise CoinbasePayloadError(f"Coinbase field {field} is malformed")
    normalized = str(value).strip()
    if percent and normalized.endswith("%"):
        normalized = normalized[:-1].strip()
    if not normalized or "," in normalized:
        raise CoinbasePayloadError(f"Coinbase field {field} is malformed")
    try:
        parsed = float(normalized)
    except ValueError as exc:
        raise CoinbasePayloadError(f"Coinbase field {field} is malformed") from exc
    if not math.isfinite(parsed) or (positive and parsed <= 0):
        raise CoinbasePayloadError(f"Coinbase field {field} is invalid")
    return parsed


def _source_timestamp_from_headers(headers: object) -> datetime:
    date_header: object | None = None
    if hasattr(headers, "get"):
        date_header = headers.get("Date")  # type: ignore[call-arg]
    if not isinstance(date_header, str) or not date_header.strip():
        raise CoinbasePayloadError("Coinbase Date header is missing")
    try:
        parsed = parsedate_to_datetime(date_header)
    except (TypeError, ValueError) as exc:
        raise CoinbasePayloadError("Coinbase Date header is malformed") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise CoinbasePayloadError("Coinbase Date header must be timezone-aware")
    return parsed.astimezone(UTC)


class CoinbaseClient:
    def fetch_quote(self) -> MarketQuote:
        try:
            response = requests.get(
                COINBASE_ENDPOINT,
                headers={"Accept": "application/json"},
                timeout=COINBASE_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload: Any = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise CoinbaseProviderError("Coinbase request failed") from exc

        return self.parse_quote(
            payload,
            source_timestamp=_source_timestamp_from_headers(response.headers),
            fetched_at=datetime.now(UTC),
        )

    @staticmethod
    def parse_quote(
        payload: object,
        *,
        source_timestamp: datetime,
        fetched_at: datetime | None = None,
    ) -> MarketQuote:
        if not isinstance(payload, dict):
            raise CoinbasePayloadError("Coinbase payload must be an object")
        if payload.get("product_id") != "BTC-USD":
            raise CoinbasePayloadError("Coinbase product_id must be BTC-USD")

        price = _strict_number(
            payload.get("price"), field="price", positive=True
        )
        percentage = _strict_number(
            payload.get("price_percentage_change_24h"),
            field="price_percentage_change_24h",
            percent=True,
        )
        if source_timestamp.tzinfo is None or source_timestamp.utcoffset() is None:
            raise CoinbasePayloadError("source_timestamp must be timezone-aware")
        actual_fetched_at = fetched_at or datetime.now(UTC)
        if actual_fetched_at.tzinfo is None or actual_fetched_at.utcoffset() is None:
            raise CoinbasePayloadError("fetched_at must be timezone-aware")

        return MarketQuote(
            pair="BTC/USD",
            base_currency="BTC",
            quote_currency="USD",
            asset_class=MarketAssetClass.MARKET_ASSET,
            rate=price,
            change=percentage,
            change_type=MarketChangeType.PERCENT,
            state=MarketQuoteState.FRESH,
            source="COINBASE",
            source_timestamp=source_timestamp.astimezone(UTC),
            fetched_at=actual_fetched_at.astimezone(UTC),
        )
