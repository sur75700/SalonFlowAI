import asyncio
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest
import requests

from app.api.deps import require_auth
from app.api.market import router as market_router
from app.market.cba import CbaClient, CbaPayloadError, CbaProviderError
from app.market.coinbase import (
    CoinbaseClient,
    CoinbasePayloadError,
    CoinbaseProviderError,
)
from app.market.contracts import (
    MarketAssetClass,
    MarketChangeType,
    MarketPulseResponse,
    MarketQuote,
    MarketQuoteState,
)
from app.market.service import MarketPulseService, get_market_pulse_service


CBA_XML = """<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ExchangeRatesLatestResponse xmlns="http://www.cba.am/">
      <ExchangeRatesLatestResult>
        <CurrentDate>2026-09-04T00:00:00</CurrentDate>
        <Rates>
          <ExchangeRate><ISO>USD</ISO><Amount>1</Amount><Rate>385.50</Rate><Difference>0.20</Difference></ExchangeRate>
          <ExchangeRate><ISO>EUR</ISO><Amount>1</Amount><Rate>451.25</Rate><Difference>-0.40</Difference></ExchangeRate>
          <ExchangeRate><ISO>RUB</ISO><Amount>10</Amount><Rate>47.80</Rate><Difference>0.10</Difference></ExchangeRate>
        </Rates>
      </ExchangeRatesLatestResult>
    </ExchangeRatesLatestResponse>
  </soap:Body>
</soap:Envelope>"""

NOW = datetime(2026, 9, 6, 20, 0, tzinfo=UTC)
SOURCE = datetime(2026, 9, 6, 19, 59, tzinfo=UTC)


def test_cba_valid_quote_and_amount_normalization():
    quotes = CbaClient.parse_quotes(CBA_XML, fetched_at=NOW)
    assert [quote.pair for quote in quotes] == ["USD/AMD", "EUR/AMD", "RUB/AMD"]
    assert quotes[0].rate == pytest.approx(385.50)
    assert quotes[2].rate == pytest.approx(4.78)
    assert quotes[2].change == pytest.approx(0.01)
    assert all(quote.source_timestamp != quote.fetched_at for quote in quotes)


@pytest.mark.parametrize(
    "field,replacement",
    [
        ("<Rate>385.50</Rate>", "<Rate>bad</Rate>"),
        ("<Amount>1</Amount>", "<Amount>0</Amount>"),
    ],
)
def test_cba_rejects_malformed_rate_or_amount(field, replacement):
    with pytest.raises(CbaPayloadError):
        CbaClient.parse_quotes(CBA_XML.replace(field, replacement, 1), fetched_at=NOW)


def test_cba_rejects_missing_currency_and_malformed_payload():
    missing_rub = CBA_XML.replace(
        "<ExchangeRate><ISO>RUB</ISO><Amount>10</Amount><Rate>47.80</Rate><Difference>0.10</Difference></ExchangeRate>",
        "",
    )
    with pytest.raises(CbaPayloadError):
        CbaClient.parse_quotes(missing_rub, fetched_at=NOW)
    with pytest.raises(CbaPayloadError):
        CbaClient.parse_quotes("<not-xml", fetched_at=NOW)


def test_cba_timeout_is_provider_failure(monkeypatch):
    def timeout(*_args, **_kwargs):
        raise requests.Timeout("timeout")
    monkeypatch.setattr("app.market.cba.requests.post", timeout)
    with pytest.raises(CbaProviderError):
        CbaClient().fetch_quotes()


def test_coinbase_valid_quote_and_percentage():
    quote = CoinbaseClient.parse_quote(
        {
            "product_id": "BTC-USD",
            "price": "101234.50",
            "price_percentage_change_24h": "-1.25%",
        },
        source_timestamp=SOURCE,
        fetched_at=NOW,
    )
    assert quote.pair == "BTC/USD"
    assert quote.rate == pytest.approx(101234.50)
    assert quote.change == pytest.approx(-1.25)
    assert quote.asset_class == MarketAssetClass.MARKET_ASSET


@pytest.mark.parametrize(
    "payload",
    [
        {"product_id": "BTC-USD", "price": "zero", "price_percentage_change_24h": "1%"},
        {"product_id": "BTC-USD", "price": "100", "price_percentage_change_24h": "bad"},
        {"product_id": "ETH-USD", "price": "100", "price_percentage_change_24h": "1%"},
        [],
    ],
)
def test_coinbase_rejects_invalid_payload(payload):
    with pytest.raises(CoinbasePayloadError):
        CoinbaseClient.parse_quote(
            payload,
            source_timestamp=SOURCE,
            fetched_at=NOW,
        )


def test_coinbase_timeout_is_provider_failure(monkeypatch):
    def timeout(*_args, **_kwargs):
        raise requests.Timeout("timeout")
    monkeypatch.setattr("app.market.coinbase.requests.get", timeout)
    with pytest.raises(CoinbaseProviderError):
        CoinbaseClient().fetch_quote()


def fiat_quotes(rate=385.0):
    return tuple(
        MarketQuote(
            pair=f"{iso}/AMD",
            base_currency=iso,
            quote_currency="AMD",
            asset_class=MarketAssetClass.FIAT,
            rate=value,
            change=0.1,
            change_type=MarketChangeType.ABSOLUTE,
            state=MarketQuoteState.FRESH,
            source="CBA",
            source_timestamp=SOURCE,
            fetched_at=NOW,
        )
        for iso, value in (("USD", rate), ("EUR", 450.0), ("RUB", 4.8))
    )


def btc_quote(rate=100000.0):
    return MarketQuote(
        pair="BTC/USD",
        base_currency="BTC",
        quote_currency="USD",
        asset_class=MarketAssetClass.MARKET_ASSET,
        rate=rate,
        change=1.2,
        change_type=MarketChangeType.PERCENT,
        state=MarketQuoteState.FRESH,
        source="COINBASE",
        source_timestamp=SOURCE,
        fetched_at=NOW,
    )


class FakeCba:
    def __init__(self, values=None, error=None):
        self.values = values or fiat_quotes()
        self.error = error
        self.calls = 0
    def fetch_quotes(self):
        self.calls += 1
        if self.error:
            raise self.error
        return self.values


class FakeCoinbase:
    def __init__(self, value=None, error=None):
        self.value = value or btc_quote()
        self.error = error
        self.calls = 0
    def fetch_quote(self):
        self.calls += 1
        if self.error:
            raise self.error
        return self.value


def test_cache_fresh_stale_unavailable_and_retention():
    now = [NOW]
    cba = FakeCba()
    coinbase = FakeCoinbase()
    service = MarketPulseService(
        cba=cba,
        coinbase=coinbase,
        clock=lambda: now[0],
        cba_ttl_seconds=60,
        coinbase_ttl_seconds=60,
    )
    first = asyncio.run(service.get_pulse())
    assert all(q.state == MarketQuoteState.FRESH for q in first.quotes)
    second = asyncio.run(service.get_pulse())
    assert cba.calls == 1 and coinbase.calls == 1
    assert second.quotes[0].rate == first.quotes[0].rate

    now[0] = NOW + timedelta(seconds=61)
    cba.error = CbaProviderError("down")
    stale = asyncio.run(service.get_pulse())
    assert [q.state for q in stale.quotes[:3]] == [MarketQuoteState.STALE] * 3
    assert stale.quotes[0].rate == first.quotes[0].rate
    assert stale.quotes[3].state == MarketQuoteState.FRESH

    empty = MarketPulseService(
        cba=FakeCba(error=CbaProviderError("down")),
        coinbase=FakeCoinbase(error=CoinbaseProviderError("down")),
        clock=lambda: NOW,
    )
    unavailable = asyncio.run(empty.get_pulse())
    assert all(q.state == MarketQuoteState.UNAVAILABLE for q in unavailable.quotes)
    assert all(q.rate is None for q in unavailable.quotes)


def test_independent_provider_failure():
    service = MarketPulseService(
        cba=FakeCba(error=CbaProviderError("down")),
        coinbase=FakeCoinbase(),
        clock=lambda: NOW,
    )
    pulse = asyncio.run(service.get_pulse())
    assert all(q.state == MarketQuoteState.UNAVAILABLE for q in pulse.quotes[:3])
    assert pulse.quotes[3].state == MarketQuoteState.FRESH


class FakeService:
    async def get_pulse(self):
        return MarketPulseResponse(
            quotes=(*fiat_quotes(), btc_quote()), generated_at=NOW
        )


def make_api(*, authenticated: bool) -> TestClient:
    app = FastAPI()
    app.include_router(market_router, prefix="/market")
    app.dependency_overrides[get_market_pulse_service] = lambda: FakeService()
    if authenticated:
        app.dependency_overrides[require_auth] = lambda: {"admin_id": "owner"}
    return TestClient(app)


def test_api_authentication_required():
    response = make_api(authenticated=False).get("/market/pulse")
    assert response.status_code == 401


def test_api_shape_mixed_availability_and_no_secret_leakage():
    response = make_api(authenticated=True).get("/market/pulse")
    assert response.status_code == 200
    body = response.json()
    assert [q["pair"] for q in body["quotes"]] == [
        "USD/AMD", "EUR/AMD", "RUB/AMD", "BTC/USD"
    ]
    rendered = str(body).lower()
    assert "authorization" not in rendered
    assert "api_key" not in rendered
    assert "secret" not in rendered


def test_api_rejects_all_client_query_injection():
    response = make_api(authenticated=True).get(
        "/market/pulse?provider_url=https://example.invalid"
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "market_pulse_query_not_supported"


def unavailable_quote(pair, base, quote, asset_class, change_type, source):
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
        fetched_at=NOW,
    )


class FixedPulseService:
    def __init__(self, pulse):
        self.pulse = pulse

    async def get_pulse(self):
        return self.pulse


def make_api_for_pulse(pulse):
    app = FastAPI()
    app.include_router(market_router, prefix="/market")
    app.dependency_overrides[get_market_pulse_service] = lambda: FixedPulseService(pulse)
    app.dependency_overrides[require_auth] = lambda: {"admin_id": "owner"}
    return TestClient(app)


def test_api_supports_mixed_provider_availability_deterministically():
    pulse = MarketPulseResponse(
        quotes=(
            unavailable_quote(
                "USD/AMD", "USD", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            unavailable_quote(
                "EUR/AMD", "EUR", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            unavailable_quote(
                "RUB/AMD", "RUB", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            btc_quote(),
        ),
        generated_at=NOW,
    )
    body = make_api_for_pulse(pulse).get("/market/pulse").json()
    assert [quote["pair"] for quote in body["quotes"]] == [
        "USD/AMD", "EUR/AMD", "RUB/AMD", "BTC/USD"
    ]
    assert [quote["state"] for quote in body["quotes"]] == [
        "UNAVAILABLE", "UNAVAILABLE", "UNAVAILABLE", "FRESH"
    ]


def test_api_supports_fully_unavailable_providers_without_zero_fabrication():
    pulse = MarketPulseResponse(
        quotes=(
            unavailable_quote(
                "USD/AMD", "USD", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            unavailable_quote(
                "EUR/AMD", "EUR", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            unavailable_quote(
                "RUB/AMD", "RUB", "AMD", MarketAssetClass.FIAT,
                MarketChangeType.ABSOLUTE, "CBA",
            ),
            unavailable_quote(
                "BTC/USD", "BTC", "USD", MarketAssetClass.MARKET_ASSET,
                MarketChangeType.PERCENT, "COINBASE",
            ),
        ),
        generated_at=NOW,
    )
    response = make_api_for_pulse(pulse).get("/market/pulse")
    assert response.status_code == 200
    quotes = response.json()["quotes"]
    assert all(quote["state"] == "UNAVAILABLE" for quote in quotes)
    assert all(quote["rate"] is None for quote in quotes)
    assert all(quote["source_timestamp"] is None for quote in quotes)
