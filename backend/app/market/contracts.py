from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class MarketQuoteState(StrEnum):
    FRESH = "FRESH"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"


class MarketAssetClass(StrEnum):
    FIAT = "FIAT"
    MARKET_ASSET = "MARKET_ASSET"


class MarketChangeType(StrEnum):
    ABSOLUTE = "ABSOLUTE"
    PERCENT = "PERCENT"


class MarketQuote(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    pair: str
    base_currency: str
    quote_currency: str
    asset_class: MarketAssetClass
    rate: float | None
    change: float | None
    change_type: MarketChangeType
    state: MarketQuoteState
    source: str
    source_timestamp: datetime | None
    fetched_at: datetime

    @field_validator("rate")
    @classmethod
    def validate_rate(cls, value: float | None) -> float | None:
        if value is not None and value <= 0:
            raise ValueError("market quote rate must be positive")
        return value

    @model_validator(mode="after")
    def validate_availability(self) -> "MarketQuote":
        if self.state == MarketQuoteState.UNAVAILABLE:
            if self.rate is not None or self.source_timestamp is not None:
                raise ValueError(
                    "unavailable quotes cannot expose a rate or source timestamp"
                )
        elif self.rate is None or self.source_timestamp is None:
            raise ValueError(
                "available quotes require rate and source timestamp"
            )
        return self


class MarketPulseResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    quotes: tuple[MarketQuote, ...]
    generated_at: datetime

    @model_validator(mode="after")
    def validate_pairs(self) -> "MarketPulseResponse":
        expected = ("USD/AMD", "EUR/AMD", "RUB/AMD", "BTC/USD")
        actual = tuple(quote.pair for quote in self.quotes)
        if actual != expected:
            raise ValueError("market pulse quotes must use the canonical pair order")
        return self
