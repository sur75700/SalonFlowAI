from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from bson import ObjectId

from app.intelligence.authoritative_capacity_source import (
    AuthoritativeCapacitySource,
)
from app.intelligence.capacity import CapacityDataUnavailable
from app.intelligence.capacity_baseline_source import prepare_capacity_context
from app.intelligence.context import IntelligenceContext
from app.intelligence.models.windows import (
    AnalysisWindow,
    resolve_local_date_window_utc,
)
from app.intelligence.providers.mongo_capacity_provider import (
    MongoCapacityProvider,
)
from app.intelligence.providers.mongo_client_provider import MongoClientProvider
from app.intelligence.providers.mongo_revenue_provider import MongoRevenueProvider
from app.intelligence.providers.mongo_service_provider import MongoServiceProvider
from app.reports.contracts import (
    REPORT_EXPORT_ROW_LIMIT,
    REPORT_MAX_RANGE_DAYS,
    REPORT_TYPES,
    ReportContractError,
    ReportDocument,
    ReportFilters,
    ReportPeriod,
    normalize_report_currency,
)
from app.reports.daily_summary import build_daily_summary_report
from app.reports.models import normalize_report_locale


_TITLE_KEYS = {
    "daily-summary": "reports.daily_summary.title",
    "appointments": "reports.appointments.title",
    "revenue-summary": "reports.revenue_summary.title",
    "client-summary": "reports.client_summary.title",
    "service-performance": "reports.service_performance.title",
    "capacity-utilization": "reports.capacity_utilization.title",
}


def _owner_id(value: object) -> str:
    normalized = value.strip() if isinstance(value, str) else ""
    if not normalized or not ObjectId.is_valid(normalized):
        raise ValueError("owner_id must be a valid Mongo ObjectId string")
    return normalized


def _generated_at(value: datetime | None) -> datetime:
    generated = value or datetime.now(UTC)
    if generated.utcoffset() is None:
        raise ValueError("generated_at must be timezone-aware")
    return generated.astimezone(UTC)


def _parse_date(value: str | None) -> date | None:
    if value is None:
        return None
    if (
        not isinstance(value, str)
        or len(value) != 10
        or value[4] != "-"
        or value[7] != "-"
    ):
        raise ReportContractError("422_invalid_report_date_range", 422)
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as error:
        raise ReportContractError(
            "422_invalid_report_date_range",
            422,
        ) from error
    if parsed.isoformat() != value:
        raise ReportContractError("422_invalid_report_date_range", 422)
    return parsed


async def _resolve_timezone(
    *,
    database: Any,
    owner_id: str,
) -> tuple[str, tuple[str, ...]]:
    profile = await database.salon_capacity_profiles.find_one(
        {"owner_id": owner_id, "status": "active"}
    )
    candidate = (
        profile.get("timezone")
        if isinstance(profile, dict)
        else None
    )
    timezone_name = candidate.strip() if isinstance(candidate, str) else ""
    if timezone_name:
        try:
            ZoneInfo(timezone_name)
            return timezone_name, ()
        except (ZoneInfoNotFoundError, ValueError):
            pass
    return "UTC", ("timezone_fallback_utc",)




def _resolve_dates(
    *,
    report_type: str,
    start_date: str | None,
    end_date: str | None,
    timezone_name: str,
    generated_at: datetime,
) -> ReportPeriod:
    start = _parse_date(start_date)
    end = _parse_date(end_date)

    if report_type == "daily-summary":
        if start is None and end is None:
            local_today = generated_at.astimezone(
                ZoneInfo(timezone_name)
            ).date()
            start = local_today
            end = local_today
        elif start is None or end is None or start != end:
            raise ReportContractError(
                "422_invalid_report_date_range",
                422,
            )
    elif start is None or end is None:
        raise ReportContractError("422_invalid_report_date_range", 422)

    if start is None or end is None or end < start:
        raise ReportContractError("422_invalid_report_date_range", 422)

    day_count = (end - start).days + 1
    if day_count < 1:
        raise ReportContractError("422_invalid_report_date_range", 422)
    if day_count > REPORT_MAX_RANGE_DAYS:
        raise ReportContractError(
            "422_report_date_range_too_large",
            422,
        )

    try:
        period_start, period_end = resolve_local_date_window_utc(
            start=start,
            end=end,
            timezone_name=timezone_name,
        )
    except (TypeError, ValueError, OverflowError) as error:
        raise ReportContractError(
            "422_invalid_report_date_range",
            422,
        ) from error

    return ReportPeriod(
        start_date=start,
        end_date=end,
        timezone=timezone_name,
        start_utc=period_start,
        end_utc=period_end,
    )


def _mongo_filter(values: tuple[str, ...]) -> object:
    object_ids = [ObjectId(value) for value in values]
    return object_ids[0] if len(object_ids) == 1 else {"$in": object_ids}


async def _appointment_documents(
    *,
    database: Any,
    owner_id: str,
    period: ReportPeriod,
    filters: ReportFilters,
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {
        "owner_id": owner_id,
        "starts_at": {
            "$gte": period.start_utc.isoformat(),
            "$lt": period.end_utc.isoformat(),
        },
    }
    if filters.status:
        query["status"] = (
            filters.status[0]
            if len(filters.status) == 1
            else {"$in": list(filters.status)}
        )
    if filters.client_id:
        query["client_id"] = _mongo_filter(filters.client_id)
    if filters.service_id:
        query["service_id"] = _mongo_filter(filters.service_id)

    documents = await (
        database.appointments.find(query)
        .sort("starts_at", 1)
        .to_list(length=REPORT_EXPORT_ROW_LIMIT + 1)
    )
    if len(documents) > REPORT_EXPORT_ROW_LIMIT:
        raise ReportContractError("413_report_too_large", 413)
    return documents


def _safe_text(value: object, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value.astimezone(UTC).isoformat()
    return str(value)


def _appointment_rows(
    documents: list[dict[str, Any]],
) -> tuple[tuple[Any, ...], ...]:
    return tuple(
        (
            _safe_text(item.get("starts_at")),
            _safe_text(item.get("client_name"), "-"),
            _safe_text(item.get("service_name"), "-"),
            _safe_text(item.get("status"), "-"),
            _safe_text(item.get("notes")),
        )
        for item in documents
    )


def _appointment_metrics(
    documents: list[dict[str, Any]],
) -> dict[str, int]:
    statuses = [
        str(item.get("status") or "").strip().lower()
        for item in documents
    ]
    return {
        "appointments": len(documents),
        "scheduled": statuses.count("scheduled"),
        "completed": statuses.count("completed"),
        "cancelled": statuses.count("cancelled"),
    }


def _context(
    *,
    owner_id: str,
    locale: str,
    timezone_name: str,
    currency: str,
    period: ReportPeriod,
    generated_at: datetime,
) -> IntelligenceContext:
    return IntelligenceContext(
        owner_id=owner_id,
        locale=locale,
        timezone=timezone_name,
        currency=currency,
        window=AnalysisWindow(
            start=period.start_date,
            end=period.end_date,
            label="report",
        ),
        generated_at=generated_at,
    )


def _validate_provider_snapshot(
    *,
    snapshot: Any,
    owner_id: str,
    period: ReportPeriod,
    currency: str | None = None,
) -> None:
    if getattr(snapshot, "owner_id", None) != owner_id:
        raise RuntimeError("report provider returned cross-owner data")
    if (
        getattr(snapshot, "period_start", None) != period.start_utc
        or getattr(snapshot, "period_end", None) != period.end_utc
    ):
        raise RuntimeError("report provider returned a mismatched period")
    if (
        currency is not None
        and getattr(snapshot, "currency", None) != currency
    ):
        raise RuntimeError("report provider returned a mismatched currency")


def _document(
    *,
    owner_id: str,
    report_type: str,
    period: ReportPeriod,
    locale: str,
    generated_at: datetime,
    filters: ReportFilters,
    metrics: dict[str, Any],
    columns: tuple[str, ...] = (),
    rows: tuple[tuple[Any, ...], ...] = (),
    warnings: tuple[str, ...] = (),
) -> ReportDocument:
    if len(rows) > REPORT_EXPORT_ROW_LIMIT:
        raise ReportContractError("413_report_too_large", 413)
    return ReportDocument(
        owner_id=owner_id,
        report_type=report_type,
        title_key=_TITLE_KEYS[report_type],
        period=period,
        locale=locale,
        generated_at=generated_at,
        applied_filters=filters.public_dict(),
        metrics=metrics,
        columns=columns,
        rows=rows,
        warnings=tuple(dict.fromkeys(warnings)),
        total_rows=len(rows),
    )


async def build_report_document(
    *,
    database: Any,
    owner_id: str,
    report_type: str,
    start_date: str | None,
    end_date: str | None,
    locale: str | None,
    filters: ReportFilters,
    currency: str | None = None,
    generated_at: datetime | None = None,
) -> ReportDocument:
    if database is None:
        raise RuntimeError("Database not connected")
    if report_type not in REPORT_TYPES:
        raise ReportContractError("422_invalid_report_filter", 422)

    owner = _owner_id(owner_id)
    generated = _generated_at(generated_at)
    normalized_locale = normalize_report_locale(locale)
    timezone_name, timezone_warnings = await _resolve_timezone(
        database=database,
        owner_id=owner,
    )
    period = _resolve_dates(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        timezone_name=timezone_name,
        generated_at=generated,
    )
    report_currency = normalize_report_currency(
        report_type=report_type,
        currency=currency,
    )

    if report_type in {"daily-summary", "appointments"}:
        documents = await _appointment_documents(
            database=database,
            owner_id=owner,
            period=period,
            filters=filters,
        )
        metrics = _appointment_metrics(documents)
        if report_type == "daily-summary":
            legacy = await build_daily_summary_report(
                database=database,
                owner_id=owner,
                report_date=period.start_date,
                locale=normalized_locale,
                generated_at=generated,
            )
            metrics = {
                "total_clients": legacy.metrics.total_clients,
                "total_services": legacy.metrics.total_services,
                "total_appointments": legacy.metrics.total_appointments,
                "appointments_on_date": len(documents),
                "scheduled_on_date": metrics["scheduled"],
                "completed_on_date": metrics["completed"],
                "cancelled_on_date": metrics["cancelled"],
            }
        return _document(
            owner_id=owner,
            report_type=report_type,
            period=period,
            locale=normalized_locale,
            generated_at=generated,
            filters=filters,
            metrics=metrics,
            columns=("start", "client", "service", "status", "notes"),
            rows=_appointment_rows(documents),
            warnings=timezone_warnings,
        )

    context = _context(
        owner_id=owner,
        locale=normalized_locale,
        timezone_name=timezone_name,
        currency=report_currency or "AMD",
        period=period,
        generated_at=generated,
    )
    warnings = timezone_warnings

    if report_type == "revenue-summary":
        snapshot = await MongoRevenueProvider().get_revenue_snapshot(
            context=context
        )
        _validate_provider_snapshot(
            snapshot=snapshot,
            owner_id=owner,
            period=period,
            currency=report_currency,
        )
        return _document(
            owner_id=owner,
            report_type=report_type,
            period=period,
            locale=normalized_locale,
            generated_at=generated,
            filters=filters,
            metrics={
                "currency": snapshot.currency,
                "completed_booking_count": snapshot.completed_booking_count,
                "gross_revenue_minor": snapshot.gross_revenue_minor,
                "previous_gross_revenue_minor": (
                    snapshot.previous_gross_revenue_minor
                ),
                "average_ticket_minor": snapshot.average_ticket_minor,
            },
            warnings=warnings,
        )

    if report_type == "client-summary":
        snapshot = await MongoClientProvider().get_client_snapshot(
            context=context
        )
        _validate_provider_snapshot(
            snapshot=snapshot,
            owner_id=owner,
            period=period,
            currency=report_currency,
        )
        return _document(
            owner_id=owner,
            report_type=report_type,
            period=period,
            locale=normalized_locale,
            generated_at=generated,
            filters=filters,
            metrics={
                "currency": snapshot.currency,
                "total_client_count": snapshot.total_client_count,
                "new_client_count": snapshot.new_client_count,
                "active_client_count": snapshot.active_client_count,
                "returning_client_count": snapshot.returning_client_count,
                "historically_active_client_count": (
                    snapshot.historically_active_client_count
                ),
                "at_risk_client_count": snapshot.at_risk_client_count,
                "high_value_client_count": snapshot.high_value_client_count,
                "completed_booking_count": snapshot.completed_booking_count,
                "completed_revenue_minor": snapshot.completed_revenue_minor,
            },
            warnings=warnings,
        )

    if report_type == "service-performance":
        snapshot = await MongoServiceProvider().get_service_snapshot(
            context=context
        )
        _validate_provider_snapshot(
            snapshot=snapshot,
            owner_id=owner,
            period=period,
            currency=report_currency,
        )
        service_ids = set(filters.service_id)
        services = tuple(
            item
            for item in snapshot.services
            if not service_ids or item.service_id in service_ids
        )
        rows = tuple(
            (
                item.service_id,
                item.name,
                item.catalog_present,
                item.is_active,
                item.duration_minutes,
                item.configured_price_minor,
                item.appointment_count,
                item.completed_booking_count,
                item.scheduled_booking_count,
                item.cancelled_booking_count,
                item.completed_revenue_minor,
            )
            for item in services
        )
        return _document(
            owner_id=owner,
            report_type=report_type,
            period=period,
            locale=normalized_locale,
            generated_at=generated,
            filters=filters,
            metrics={
                "currency": snapshot.currency,
                "total_service_count": len(services),
                "active_service_count": sum(
                    1 for item in services if item.is_active
                ),
            },
            columns=(
                "service_id",
                "name",
                "catalog_present",
                "is_active",
                "duration_minutes",
                "configured_price_minor",
                "appointment_count",
                "completed_booking_count",
                "scheduled_booking_count",
                "cancelled_booking_count",
                "completed_revenue_minor",
            ),
            rows=rows,
            warnings=warnings,
        )

    try:
        context = await prepare_capacity_context(
            context=context,
            source=AuthoritativeCapacitySource(
                database=database,
                period_start=period.start_utc,
                period_end=period.end_utc,
            ),
        )
        snapshot = await MongoCapacityProvider().get_capacity_snapshot(
            context=context
        )
    except CapacityDataUnavailable as error:
        raise ReportContractError("422_capacity_unavailable", 422) from error

    _validate_provider_snapshot(
        snapshot=snapshot,
        owner_id=owner,
        period=period,
    )
    return _document(
        owner_id=owner,
        report_type=report_type,
        period=period,
        locale=normalized_locale,
        generated_at=generated,
        filters=filters,
        metrics={
            "total_slots": snapshot.total_slots,
            "booked_slots": snapshot.booked_slots,
            "completed_booking_count": snapshot.completed_booking_count,
            "active_staff_count": snapshot.active_staff_count,
            "available_minutes": snapshot.available_minutes,
            "booked_minutes": snapshot.booked_minutes,
        },
        warnings=warnings,
    )
