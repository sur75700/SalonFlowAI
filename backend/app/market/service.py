from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock
from typing import Callable, Generic, TypeVar

from app.market.cba import CbaClient, CbaProviderError
from app.market.coinbase import CoinbaseClient, CoinbaseProviderError
from app.market.contracts import (
    MarketAssetClass,
    MarketChangeType,
    MarketPulseResponse,
    MarketQuote,
    MarketQuoteState,
)


T = TypeVar("T")
CBA_TTL_SECONDS = 15 * 60
COINBASE_TTL_SECONDS = 60


@dataclass(slots=True)
class _CacheEntry(Generic[T]):
    value: T
    cached_at: datetime


Clock = Callable[[], datetime]


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _unavailable_quote(
    pair: str,
    base: str,
    quote: str,
    asset_class: MarketAssetClass,
    change_type: MarketChangeType,
    source: str,
    now: datetime,
) -> MarketQuote:
    return MarketQuote(
        pair=pair,
        base_currency=base,
        quote_currency=quote,
        asset_class=asset_class,
        rate=None,
        change=None,
        change_type=change_type,
        state=MarketQuoteState.UNAVAILABLE,
        source=source,
        source_timestamp=None,
        fetched_at=now,
    )


def _with_state(quote: MarketQuote, state: MarketQuoteState) -> MarketQuote:
    return quote.model_copy(update={"state": state})


class MarketPulseService:
    def __init__(
        self,
        *,
        cba: CbaClient | None = None,
        coinbase: CoinbaseClient | None = None,
        clock: Clock = _utc_now,
        cba_ttl_seconds: int = CBA_TTL_SECONDS,
        coinbase_ttl_seconds: int = COINBASE_TTL_SECONDS,
    ) -> None:
        self._cba = cba or CbaClient()
        self._coinbase = coinbase or CoinbaseClient()
        self._clock = clock
        self._cba_ttl_seconds = cba_ttl_seconds
        self._coinbase_ttl_seconds = coinbase_ttl_seconds
        self._cba_cache: _CacheEntry[
            tuple[MarketQuote, MarketQuote, MarketQuote]
        ] | None = None
        self._coinbase_cache: _CacheEntry[MarketQuote] | None = None
        self._cba_lock = Lock()
        self._coinbase_lock = Lock()

    def _now(self) -> datetime:
        value = self._clock()
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("MarketPulseService clock must be timezone-aware")
        return value.astimezone(UTC)

    @staticmethod
    def _cache_is_fresh(
        cached_at: datetime, now: datetime, ttl_seconds: int
    ) -> bool:
        return (now - cached_at).total_seconds() < ttl_seconds

    def _resolve_cba(self) -> tuple[MarketQuote, MarketQuote, MarketQuote]:
        with self._cba_lock:
            now = self._now()
            cache = self._cba_cache
            if cache and self._cache_is_fresh(
                cache.cached_at, now, self._cba_ttl_seconds
            ):
                return tuple(
                    _with_state(quote, MarketQuoteState.FRESH)
                    for quote in cache.value
                )  # type: ignore[return-value]

            try:
                quotes = self._cba.fetch_quotes()
            except CbaProviderError:
                if cache:
                    return tuple(
                        _with_state(quote, MarketQuoteState.STALE)
                        for quote in cache.value
                    )  # type: ignore[return-value]
                return (
                    _unavailable_quote(
                        "USD/AMD", "USD", "AMD", MarketAssetClass.FIAT,
                        MarketChangeType.ABSOLUTE, "CBA", now,
                    ),
                    _unavailable_quote(
                        "EUR/AMD", "EUR", "AMD", MarketAssetClass.FIAT,
                        MarketChangeType.ABSOLUTE, "CBA", now,
                    ),
                    _unavailable_quote(
                        "RUB/AMD", "RUB", "AMD", MarketAssetClass.FIAT,
                        MarketChangeType.ABSOLUTE, "CBA", now,
                    ),
                )

            self._cba_cache = _CacheEntry(value=quotes, cached_at=now)
            return tuple(
                _with_state(quote, MarketQuoteState.FRESH) for quote in quotes
            )  # type: ignore[return-value]

    def _resolve_coinbase(self) -> MarketQuote:
        with self._coinbase_lock:
            now = self._now()
            cache = self._coinbase_cache
            if cache and self._cache_is_fresh(
                cache.cached_at, now, self._coinbase_ttl_seconds
            ):
                return _with_state(cache.value, MarketQuoteState.FRESH)

            try:
                quote = self._coinbase.fetch_quote()
            except CoinbaseProviderError:
                if cache:
                    return _with_state(cache.value, MarketQuoteState.STALE)
                return _unavailable_quote(
                    "BTC/USD", "BTC", "USD", MarketAssetClass.MARKET_ASSET,
                    MarketChangeType.PERCENT, "COINBASE", now,
                )

            self._coinbase_cache = _CacheEntry(value=quote, cached_at=now)
            return _with_state(quote, MarketQuoteState.FRESH)

    async def get_pulse(self) -> MarketPulseResponse:
        fiat_task = asyncio.to_thread(self._resolve_cba)
        btc_task = asyncio.to_thread(self._resolve_coinbase)
        fiat_quotes, btc_quote = await asyncio.gather(fiat_task, btc_task)
        return MarketPulseResponse(
            quotes=(*fiat_quotes, btc_quote),
            generated_at=self._now(),
        )


_market_pulse_service = MarketPulseService()


def get_market_pulse_service() -> MarketPulseService:
    return _market_pulse_service
