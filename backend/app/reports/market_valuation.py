from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Iterable, Protocol


REPORT_SOURCE_CURRENCIES = ("AMD", "USD", "EUR", "RUB")
REPORT_VALUATION_ASSETS = ("AMD", "USD", "EUR", "RUB", "BTC")

REPORT_VALUATION_SEMANTICS = (
    "generation_time_market_valuation_not_transaction_fx"
)


class ReportValuationError(RuntimeError):
    """Raised when an authoritative market valuation cannot be produced."""


class MarketQuoteLike(Protocol):
    pair: str
    rate: float | None
    state: object
    source: str
    source_timestamp: datetime | None


class MarketPulseLike(Protocol):
    quotes: Iterable[MarketQuoteLike]
    generated_at: datetime


@dataclass(frozen=True, slots=True)
class ReportValuationRate:
    source_currency: str
    target_asset: str

    # Number of target major units represented by one source major unit.
    target_per_source: Decimal

    state: str
    market_sources: tuple[str, ...]
    source_timestamps: tuple[datetime, ...]
    market_generated_at: datetime

    semantics: str = REPORT_VALUATION_SEMANTICS

    def __post_init__(self) -> None:
        if self.source_currency not in REPORT_SOURCE_CURRENCIES:
            raise ValueError("unsupported report source currency")

        if self.target_asset not in REPORT_VALUATION_ASSETS:
            raise ValueError("unsupported report valuation asset")

        if (
            not self.target_per_source.is_finite()
            or self.target_per_source <= 0
        ):
            raise ValueError("valuation rate must be finite and positive")

        if self.state not in {"fresh", "stale", "identity"}:
            raise ValueError("unsupported valuation state")

        if self.market_generated_at.tzinfo is None:
            raise ValueError("market_generated_at must be timezone-aware")


    def public_dict(self) -> dict[str, object]:
        return {
            "source_currency": self.source_currency,
            "valuation_currency": self.target_asset,
            "target_per_source": format(
                self.target_per_source,
                "f",
            ),
            "state": self.state,
            "market_sources": list(self.market_sources),
            "source_timestamps": [
                value.isoformat()
                for value in self.source_timestamps
            ],
            "market_generated_at": (
                self.market_generated_at.isoformat()
            ),
            "semantics": self.semantics,
            "is_market_asset": (
                self.target_asset == "BTC"
            ),
        }


def normalize_report_valuation_asset(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip().upper()

    if normalized not in REPORT_VALUATION_ASSETS:
        raise ReportValuationError(
            "unsupported report valuation asset"
        )

    return normalized


def _state_name(value: object) -> str:
    raw = getattr(value, "value", value)
    return str(raw).strip().lower()


def _decimal_rate(value: object, *, pair: str) -> Decimal:
    try:
        rate = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ReportValuationError(
            f"invalid market rate for {pair}"
        ) from exc

    if not rate.is_finite() or rate <= 0:
        raise ReportValuationError(
            f"invalid market rate for {pair}"
        )

    return rate


def _quote_map(
    pulse: MarketPulseLike,
) -> dict[str, MarketQuoteLike]:
    quotes: dict[str, MarketQuoteLike] = {}

    for quote in pulse.quotes:
        pair = str(quote.pair).strip().upper()

        if pair in quotes:
            raise ReportValuationError(
                f"duplicate market quote for {pair}"
            )

        quotes[pair] = quote

    return quotes


def _require_quote(
    quotes: dict[str, MarketQuoteLike],
    pair: str,
) -> tuple[Decimal, str, str, datetime]:
    quote = quotes.get(pair)

    if quote is None:
        raise ReportValuationError(
            f"required market quote unavailable: {pair}"
        )

    state = _state_name(quote.state)

    if state == "unavailable":
        raise ReportValuationError(
            f"required market quote unavailable: {pair}"
        )

    if state not in {"fresh", "stale"}:
        raise ReportValuationError(
            f"unsupported market quote state for {pair}"
        )

    if quote.rate is None:
        raise ReportValuationError(
            f"required market quote has no rate: {pair}"
        )

    if quote.source_timestamp is None:
        raise ReportValuationError(
            f"required market quote has no source timestamp: {pair}"
        )

    if quote.source_timestamp.tzinfo is None:
        raise ReportValuationError(
            f"market source timestamp is naive: {pair}"
        )

    source = str(quote.source).strip()

    if not source:
        raise ReportValuationError(
            f"required market quote has no source: {pair}"
        )

    return (
        _decimal_rate(quote.rate, pair=pair),
        state,
        source,
        quote.source_timestamp,
    )


def resolve_report_valuation_rate(
    pulse: MarketPulseLike,
    *,
    source_currency: str,
    target_asset: str,
) -> ReportValuationRate:
    source = source_currency.strip().upper()
    target = target_asset.strip().upper()

    if source not in REPORT_SOURCE_CURRENCIES:
        raise ReportValuationError(
            "unsupported report source currency"
        )

    if target not in REPORT_VALUATION_ASSETS:
        raise ReportValuationError(
            "unsupported report valuation asset"
        )

    if pulse.generated_at.tzinfo is None:
        raise ReportValuationError(
            "market pulse generated_at must be timezone-aware"
        )

    if source == target:
        return ReportValuationRate(
            source_currency=source,
            target_asset=target,
            target_per_source=Decimal("1"),
            state="identity",
            market_sources=("identity",),
            source_timestamps=(),
            market_generated_at=pulse.generated_at,
        )

    quotes = _quote_map(pulse)

    used_states: list[str] = []
    used_sources: list[str] = []
    used_timestamps: list[datetime] = []

    def quote(pair: str) -> Decimal:
        rate, state, market_source, timestamp = _require_quote(
            quotes,
            pair,
        )

        used_states.append(state)
        used_sources.append(market_source)
        used_timestamps.append(timestamp)

        return rate

    # Canonical Market Pulse quotation direction:
    #   USD/AMD -> AMD per 1 USD
    #   EUR/AMD -> AMD per 1 EUR
    #   RUB/AMD -> AMD per 1 RUB
    #   BTC/USD -> USD per 1 BTC
    #
    # Convert source major units -> AMD major units first.
    if source == "AMD":
        amd_per_source = Decimal("1")
    elif source == "USD":
        amd_per_source = quote("USD/AMD")
    elif source == "EUR":
        amd_per_source = quote("EUR/AMD")
    elif source == "RUB":
        amd_per_source = quote("RUB/AMD")
    else:  # pragma: no cover - source is validated above.
        raise ReportValuationError(
            "unsupported report source currency"
        )

    if target == "AMD":
        target_per_source = amd_per_source

    elif target in {"USD", "EUR", "RUB"}:
        amd_per_target = quote(f"{target}/AMD")
        target_per_source = (
            amd_per_source / amd_per_target
        )

    elif target == "BTC":
        amd_per_usd = quote("USD/AMD")
        usd_per_btc = quote("BTC/USD")

        target_per_source = (
            amd_per_source
            / amd_per_usd
            / usd_per_btc
        )

    else:  # pragma: no cover - target is validated above.
        raise ReportValuationError(
            "unsupported report valuation asset"
        )

    combined_state = (
        "stale"
        if "stale" in used_states
        else "fresh"
    )

    return ReportValuationRate(
        source_currency=source,
        target_asset=target,
        target_per_source=target_per_source,
        state=combined_state,
        market_sources=tuple(dict.fromkeys(used_sources)),
        source_timestamps=tuple(
            dict.fromkeys(used_timestamps)
        ),
        market_generated_at=pulse.generated_at,
    )


def convert_report_major_amount(
    value: Decimal | int | str,
    valuation: ReportValuationRate,
) -> Decimal:
    try:
        amount = (
            value
            if isinstance(value, Decimal)
            else Decimal(str(value))
        )
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ReportValuationError(
            "invalid report amount"
        ) from exc

    if not amount.is_finite():
        raise ReportValuationError(
            "report amount must be finite"
        )

    return amount * valuation.target_per_source
