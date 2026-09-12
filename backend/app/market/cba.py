from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
import math
from zoneinfo import ZoneInfo
import xml.etree.ElementTree as ET

import requests

from app.market.contracts import (
    MarketAssetClass,
    MarketChangeType,
    MarketQuote,
    MarketQuoteState,
)


CBA_ENDPOINT = "https://api.cba.am/exchangerates.asmx"
CBA_SOAP_ACTION = "http://www.cba.am/ExchangeRatesLatest"
CBA_TIMEOUT_SECONDS = 5.0
CBA_CURRENCIES = ("USD", "EUR", "RUB")
_CBA_TIMEZONE = ZoneInfo("Asia/Yerevan")


class CbaProviderError(RuntimeError):
    """Raised when CBA cannot provide a trustworthy canonical quote set."""


class CbaPayloadError(CbaProviderError):
    """Raised when a CBA response violates the expected upstream contract."""


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _required_child_text(element: ET.Element, child_name: str) -> str:
    for child in list(element):
        if _local_name(child.tag) == child_name:
            text = (child.text or "").strip()
            if text:
                return text
            break
    raise CbaPayloadError(f"CBA field {child_name} is missing")


def _strict_decimal(value: str, *, field: str, positive: bool = False) -> float:
    normalized = value.strip()
    if not normalized or "," in normalized:
        raise CbaPayloadError(f"CBA field {field} is malformed")
    try:
        parsed = Decimal(normalized)
    except (InvalidOperation, ValueError) as exc:
        raise CbaPayloadError(f"CBA field {field} is malformed") from exc
    number = float(parsed)
    if not math.isfinite(number) or (positive and number <= 0):
        raise CbaPayloadError(f"CBA field {field} is invalid")
    return number


def _parse_cba_datetime(value: str) -> datetime:
    normalized = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise CbaPayloadError("CBA CurrentDate is malformed") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        parsed = parsed.replace(tzinfo=_CBA_TIMEZONE)
    return parsed.astimezone(UTC)


def _soap_request_body() -> str:
    return """<?xml version=\"1.0\" encoding=\"utf-8\"?>
<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
  <soap:Body>
    <ExchangeRatesLatest xmlns=\"http://www.cba.am/\" />
  </soap:Body>
</soap:Envelope>"""


class CbaClient:
    def fetch_quotes(self) -> tuple[MarketQuote, MarketQuote, MarketQuote]:
        try:
            response = requests.post(
                CBA_ENDPOINT,
                data=_soap_request_body().encode("utf-8"),
                headers={
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": f'"{CBA_SOAP_ACTION}"',
                },
                timeout=CBA_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CbaProviderError("CBA request failed") from exc

        return self.parse_quotes(response.text, fetched_at=datetime.now(UTC))

    @staticmethod
    def parse_quotes(
        xml_text: str,
        *,
        fetched_at: datetime | None = None,
    ) -> tuple[MarketQuote, MarketQuote, MarketQuote]:
        if not isinstance(xml_text, str) or not xml_text.strip():
            raise CbaPayloadError("CBA payload is empty")
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as exc:
            raise CbaPayloadError("CBA payload is not valid XML") from exc

        current_date_text: str | None = None
        rate_elements: list[ET.Element] = []
        for element in root.iter():
            name = _local_name(element.tag)
            if name == "CurrentDate" and current_date_text is None:
                current_date_text = (element.text or "").strip() or None
            elif name == "ExchangeRate":
                rate_elements.append(element)

        if current_date_text is None:
            raise CbaPayloadError("CBA CurrentDate is missing")
        source_timestamp = _parse_cba_datetime(current_date_text)
        actual_fetched_at = fetched_at or datetime.now(UTC)
        if actual_fetched_at.tzinfo is None or actual_fetched_at.utcoffset() is None:
            raise CbaPayloadError("fetched_at must be timezone-aware")
        actual_fetched_at = actual_fetched_at.astimezone(UTC)

        normalized: dict[str, MarketQuote] = {}
        for element in rate_elements:
            iso = _required_child_text(element, "ISO").upper()
            if iso not in CBA_CURRENCIES:
                continue
            if iso in normalized:
                raise CbaPayloadError(f"CBA currency {iso} is duplicated")

            amount = _strict_decimal(
                _required_child_text(element, "Amount"),
                field=f"{iso}.Amount",
                positive=True,
            )
            raw_rate = _strict_decimal(
                _required_child_text(element, "Rate"),
                field=f"{iso}.Rate",
                positive=True,
            )
            raw_difference = _strict_decimal(
                _required_child_text(element, "Difference"),
                field=f"{iso}.Difference",
            )

            one_unit_rate = raw_rate / amount
            one_unit_difference = raw_difference / amount
            if not math.isfinite(one_unit_rate) or one_unit_rate <= 0:
                raise CbaPayloadError(f"CBA normalized {iso} rate is invalid")
            if not math.isfinite(one_unit_difference):
                raise CbaPayloadError(
                    f"CBA normalized {iso} difference is invalid"
                )

            normalized[iso] = MarketQuote(
                pair=f"{iso}/AMD",
                base_currency=iso,
                quote_currency="AMD",
                asset_class=MarketAssetClass.FIAT,
                rate=one_unit_rate,
                change=one_unit_difference,
                change_type=MarketChangeType.ABSOLUTE,
                state=MarketQuoteState.FRESH,
                source="CBA",
                source_timestamp=source_timestamp,
                fetched_at=actual_fetched_at,
            )

        missing = [iso for iso in CBA_CURRENCIES if iso not in normalized]
        if missing:
            raise CbaPayloadError(
                "CBA canonical currencies missing: " + ",".join(missing)
            )

        return tuple(normalized[iso] for iso in CBA_CURRENCIES)  # type: ignore[return-value]
