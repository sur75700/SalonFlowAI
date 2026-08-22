from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from types import MappingProxyType
from typing import Any, Literal, Mapping

from bson import ObjectId


REPORT_SCHEMA_VERSION = 1
REPORT_TYPES = (
    "daily-summary",
    "appointments",
    "revenue-summary",
    "client-summary",
    "service-performance",
    "capacity-utilization",
)
REPORT_FORMATS_V2 = ("pdf", "txt", "csv", "xlsx", "docx")
REPORT_STATUS_VALUES = ("scheduled", "completed", "cancelled")
REPORT_FIAT_CURRENCIES = ("AMD", "USD", "EUR", "RUB")
REPORT_MARKET_ASSETS = ("BTC",)
REPORT_CURRENCY_REPORT_TYPES = frozenset(
    {"revenue-summary", "client-summary", "service-performance"}
)
BTC_SATOSHIS_PER_BTC = 100_000_000
REPORT_PREVIEW_ROW_LIMIT = 100
REPORT_EXPORT_ROW_LIMIT = 10_000
REPORT_MAX_RANGE_DAYS = 366
REPORT_MAX_FILTER_VALUES = 50

ReportTypeName = Literal[
    "daily-summary",
    "appointments",
    "revenue-summary",
    "client-summary",
    "service-performance",
    "capacity-utilization",
]
ReportFormatName = Literal["pdf", "txt", "csv", "xlsx", "docx"]

REPORT_SUPPORTED_FILTERS: Mapping[str, frozenset[str]] = MappingProxyType(
    {
        "daily-summary": frozenset({"status", "client_id", "service_id"}),
        "appointments": frozenset({"status", "client_id", "service_id"}),
        "revenue-summary": frozenset(),
        "client-summary": frozenset(),
        "service-performance": frozenset({"service_id"}),
        "capacity-utilization": frozenset(),
    }
)


class ReportContractError(ValueError):
    def __init__(self, code: str, status_code: int) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


def _utc_iso(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _freeze_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return MappingProxyType(
            {str(key): _freeze_value(item) for key, item in value.items()}
        )
    if isinstance(value, list | tuple):
        return tuple(_freeze_value(item) for item in value)
    if isinstance(value, set | frozenset):
        return tuple(sorted(_freeze_value(item) for item in value))
    return value


def _public_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {str(key): _public_value(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_public_value(item) for item in value]
    if isinstance(value, datetime):
        return _utc_iso(value)
    if isinstance(value, date):
        return value.isoformat()
    return value


@dataclass(frozen=True, slots=True)
class ReportPeriod:
    start_date: date
    end_date: date
    timezone: str
    start_utc: datetime
    end_utc: datetime

    def __post_init__(self) -> None:
        for name, value in (
            ("start_date", self.start_date),
            ("end_date", self.end_date),
        ):
            if not isinstance(value, date) or isinstance(value, datetime):
                raise TypeError(f"{name} must be a date")
        if self.end_date < self.start_date:
            raise ValueError("end_date must not precede start_date")
        timezone_name = (
            self.timezone.strip() if isinstance(self.timezone, str) else ""
        )
        if not timezone_name:
            raise ValueError("timezone is required")
        if (
            not isinstance(self.start_utc, datetime)
            or self.start_utc.utcoffset() is None
            or not isinstance(self.end_utc, datetime)
            or self.end_utc.utcoffset() is None
        ):
            raise ValueError("period UTC boundaries must be timezone-aware")
        start_utc = self.start_utc.astimezone(UTC)
        end_utc = self.end_utc.astimezone(UTC)
        if end_utc <= start_utc:
            raise ValueError("period end must be later than period start")
        object.__setattr__(self, "timezone", timezone_name)
        object.__setattr__(self, "start_utc", start_utc)
        object.__setattr__(self, "end_utc", end_utc)

    def public_dict(self) -> dict[str, Any]:
        return {
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "timezone": self.timezone,
            "start_utc": _utc_iso(self.start_utc),
            "end_utc": _utc_iso(self.end_utc),
        }


@dataclass(frozen=True, slots=True)
class ReportFilters:
    status: tuple[str, ...] = ()
    client_id: tuple[str, ...] = ()
    service_id: tuple[str, ...] = ()

    def public_dict(self) -> dict[str, list[str]]:
        return {
            key: list(value)
            for key, value in (
                ("status", self.status),
                ("client_id", self.client_id),
                ("service_id", self.service_id),
            )
            if value
        }


@dataclass(frozen=True, slots=True)
class ReportDocument:
    owner_id: str
    report_type: str
    title_key: str
    period: ReportPeriod
    locale: str
    generated_at: datetime
    applied_filters: Mapping[str, Any]
    metrics: Mapping[str, Any]
    columns: tuple[str, ...]
    rows: tuple[tuple[Any, ...], ...]
    warnings: tuple[str, ...]
    total_rows: int
    schema_version: int = REPORT_SCHEMA_VERSION

    def __post_init__(self) -> None:
        owner = self.owner_id.strip() if isinstance(self.owner_id, str) else ""
        if not owner:
            raise ValueError("owner_id is required")
        if self.report_type not in REPORT_TYPES:
            raise ValueError("unsupported report_type")
        if not isinstance(self.title_key, str) or not self.title_key.strip():
            raise ValueError("title_key is required")
        if self.locale not in {"en", "hy", "ru", "fr"}:
            raise ValueError("unsupported locale")
        if (
            not isinstance(self.generated_at, datetime)
            or self.generated_at.utcoffset() is None
        ):
            raise ValueError("generated_at must be timezone-aware")
        columns = tuple(str(item).strip() for item in self.columns)
        if any(not item for item in columns) or len(set(columns)) != len(columns):
            raise ValueError("columns must be non-empty and unique")
        rows = tuple(tuple(row) for row in self.rows)
        if any(len(row) != len(columns) for row in rows):
            raise ValueError("every row must match the column count")
        if (
            isinstance(self.total_rows, bool)
            or not isinstance(self.total_rows, int)
            or self.total_rows < 0
            or self.total_rows != len(rows)
        ):
            raise ValueError("total_rows must equal the canonical row count")
        if len(rows) > REPORT_EXPORT_ROW_LIMIT:
            raise ReportContractError("413_report_too_large", 413)

        object.__setattr__(self, "owner_id", owner)
        object.__setattr__(self, "title_key", self.title_key.strip())
        object.__setattr__(
            self,
            "generated_at",
            self.generated_at.astimezone(UTC),
        )
        object.__setattr__(
            self,
            "applied_filters",
            _freeze_value(self.applied_filters),
        )
        object.__setattr__(self, "metrics", _freeze_value(self.metrics))
        object.__setattr__(self, "columns", columns)
        object.__setattr__(self, "rows", rows)
        object.__setattr__(
            self,
            "warnings",
            tuple(str(item) for item in self.warnings),
        )

    def public_dict(self, *, row_limit: int | None = None) -> dict[str, Any]:
        rows = self.rows if row_limit is None else self.rows[: max(row_limit, 0)]
        return {
            "schema_version": self.schema_version,
            "report_type": self.report_type,
            "title_key": self.title_key,
            "period": self.period.public_dict(),
            "locale": self.locale,
            "generated_at": _utc_iso(self.generated_at),
            "applied_filters": _public_value(self.applied_filters),
            "metrics": _public_value(self.metrics),
            "columns": list(self.columns),
            "rows": _public_value(rows),
            "warnings": list(self.warnings),
            "total_rows": self.total_rows,
        }


def _dedupe(values: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(dict.fromkeys(values))


def _normalized_values(
    values: tuple[str, ...] | list[str] | None,
) -> tuple[str, ...]:
    if values is None:
        return ()
    normalized = tuple(
        value.strip()
        for value in values
        if isinstance(value, str) and value.strip()
    )
    if len(normalized) != len(values):
        raise ReportContractError("422_invalid_report_filter", 422)
    if len(normalized) > REPORT_MAX_FILTER_VALUES:
        raise ReportContractError("422_invalid_report_filter", 422)
    return _dedupe(normalized)


def normalize_report_filters(
    *,
    report_type: str,
    status: tuple[str, ...] | list[str] | None = None,
    client_id: tuple[str, ...] | list[str] | None = None,
    service_id: tuple[str, ...] | list[str] | None = None,
) -> ReportFilters:
    if report_type not in REPORT_TYPES:
        raise ReportContractError("422_invalid_report_filter", 422)

    normalized = {
        "status": _normalized_values(status),
        "client_id": _normalized_values(client_id),
        "service_id": _normalized_values(service_id),
    }
    supported = REPORT_SUPPORTED_FILTERS[report_type]
    if any(values and name not in supported for name, values in normalized.items()):
        raise ReportContractError("422_unsupported_report_filter", 422)

    if any(value not in REPORT_STATUS_VALUES for value in normalized["status"]):
        raise ReportContractError("422_invalid_report_filter", 422)

    for name in ("client_id", "service_id"):
        if any(not ObjectId.is_valid(value) for value in normalized[name]):
            raise ReportContractError("422_invalid_report_filter", 422)

    return ReportFilters(
        status=normalized["status"],
        client_id=normalized["client_id"],
        service_id=normalized["service_id"],
    )

def normalize_report_currency(
    *,
    report_type: str,
    currency: str | None,
) -> str | None:
    if report_type not in REPORT_TYPES:
        raise ReportContractError("422_invalid_report_filter", 422)

    if currency is None:
        if report_type in REPORT_CURRENCY_REPORT_TYPES:
            raise ReportContractError("422_invalid_report_filter", 422)
        return None

    normalized = currency.strip().upper() if isinstance(currency, str) else ""
    if not normalized:
        raise ReportContractError("422_invalid_report_filter", 422)
    if report_type not in REPORT_CURRENCY_REPORT_TYPES:
        raise ReportContractError("422_unsupported_report_filter", 422)
    if normalized not in REPORT_FIAT_CURRENCIES:
        raise ReportContractError("422_invalid_report_filter", 422)
    return normalized
