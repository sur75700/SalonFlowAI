from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.reports.market_valuation import (
    REPORT_VALUATION_SEMANTICS,
    ReportValuationError,
    convert_report_major_amount,
    normalize_report_valuation_asset,
    resolve_report_valuation_rate,
)


NOW = datetime(2026, 9, 23, 18, 0, tzinfo=UTC)


@dataclass(frozen=True)
class Quote:
    pair: str
    rate: float | None
    state: str
    source: str
    source_timestamp: datetime | None


@dataclass(frozen=True)
class Pulse:
    quotes: tuple[Quote, ...]
    generated_at: datetime = NOW


def pulse(
    *,
    usd_amd: float = 400.0,
    eur_amd: float = 480.0,
    rub_amd: float = 5.0,
    btc_usd: float = 100_000.0,
    state: str = "fresh",
) -> Pulse:
    return Pulse(
        quotes=(
            Quote(
                "USD/AMD",
                usd_amd,
                state,
                "CBA",
                NOW,
            ),
            Quote(
                "EUR/AMD",
                eur_amd,
                state,
                "CBA",
                NOW,
            ),
            Quote(
                "RUB/AMD",
                rub_amd,
                state,
                "CBA",
                NOW,
            ),
            Quote(
                "BTC/USD",
                btc_usd,
                state,
                "COINBASE",
                NOW,
            ),
        )
    )


def test_normalizes_supported_valuation_assets() -> None:
    assert normalize_report_valuation_asset(" usd ") == "USD"
    assert normalize_report_valuation_asset("btc") == "BTC"
    assert normalize_report_valuation_asset(None) is None


def test_rejects_unsupported_valuation_asset() -> None:
    with pytest.raises(ReportValuationError):
        normalize_report_valuation_asset("ETH")


def test_identity_does_not_require_market_quote() -> None:
    valuation = resolve_report_valuation_rate(
        Pulse(quotes=()),
        source_currency="AMD",
        target_asset="AMD",
    )

    assert valuation.target_per_source == Decimal("1")
    assert valuation.state == "identity"
    assert valuation.market_sources == ("identity",)


def test_amd_to_usd() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="AMD",
        target_asset="USD",
    )

    assert valuation.target_per_source == Decimal("0.0025")
    assert convert_report_major_amount(
        Decimal("400"),
        valuation,
    ) == Decimal("1")


def test_usd_to_amd() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="USD",
        target_asset="AMD",
    )

    assert valuation.target_per_source == Decimal("400")
    assert convert_report_major_amount(
        Decimal("10"),
        valuation,
    ) == Decimal("4000")


def test_eur_to_usd_cross_rate() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="EUR",
        target_asset="USD",
    )

    assert valuation.target_per_source == Decimal("1.2")
    assert convert_report_major_amount(
        Decimal("10"),
        valuation,
    ) == Decimal("12")


def test_rub_to_eur_cross_rate() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="RUB",
        target_asset="EUR",
    )

    assert valuation.target_per_source == (
        Decimal("5") / Decimal("480")
    )


def test_amd_to_btc_uses_usd_bridge() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="AMD",
        target_asset="BTC",
    )

    assert valuation.target_per_source == Decimal(
        "0.000000025"
    )

    assert convert_report_major_amount(
        Decimal("40000000"),
        valuation,
    ) == Decimal("1")


def test_eur_to_btc_cross_rate() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="EUR",
        target_asset="BTC",
    )

    # 1 EUR -> 480 AMD -> 1.2 USD -> 0.000012 BTC
    assert valuation.target_per_source == Decimal(
        "0.000012"
    )


def test_stale_dependency_propagates_stale_state() -> None:
    quotes = list(pulse().quotes)

    quotes[0] = Quote(
        "USD/AMD",
        400.0,
        "stale",
        "CBA",
        NOW,
    )

    valuation = resolve_report_valuation_rate(
        Pulse(tuple(quotes)),
        source_currency="EUR",
        target_asset="BTC",
    )

    assert valuation.state == "stale"


def test_unavailable_dependency_fails_closed() -> None:
    quotes = list(pulse().quotes)

    quotes[0] = Quote(
        "USD/AMD",
        None,
        "unavailable",
        "CBA",
        None,
    )

    with pytest.raises(
        ReportValuationError,
        match="required market quote unavailable",
    ):
        resolve_report_valuation_rate(
            Pulse(tuple(quotes)),
            source_currency="AMD",
            target_asset="BTC",
        )


def test_missing_required_quote_fails_closed() -> None:
    p = pulse()

    without_btc = Pulse(
        tuple(
            quote
            for quote in p.quotes
            if quote.pair != "BTC/USD"
        )
    )

    with pytest.raises(
        ReportValuationError,
        match="BTC/USD",
    ):
        resolve_report_valuation_rate(
            without_btc,
            source_currency="AMD",
            target_asset="BTC",
        )


def test_duplicate_quote_fails_closed() -> None:
    p = pulse()

    with pytest.raises(
        ReportValuationError,
        match="duplicate market quote",
    ):
        resolve_report_valuation_rate(
            Pulse(p.quotes + (p.quotes[0],)),
            source_currency="AMD",
            target_asset="USD",
        )


def test_semantics_are_explicitly_non_accounting_fx() -> None:
    valuation = resolve_report_valuation_rate(
        pulse(),
        source_currency="EUR",
        target_asset="USD",
    )

    assert (
        valuation.semantics
        == REPORT_VALUATION_SEMANTICS
        == "generation_time_market_valuation_not_transaction_fx"
    )
