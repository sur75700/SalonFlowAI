from __future__ import annotations

from datetime import UTC, date, datetime, time
from typing import Any

from app.reports.models import (
    DailySummaryAppointment,
    DailySummaryMetrics,
    DailySummaryReport,
    normalize_report_locale,
)


_MAX_APPOINTMENTS = 500


def _normalized_owner_id(owner_id: object) -> str:
    normalized = owner_id.strip() if isinstance(owner_id, str) else ""
    if not normalized:
        raise ValueError("owner_id is required")
    return normalized


def _text(value: object, *, fallback: str = "-") -> str:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value.isoformat()
    rendered = str(value)
    return rendered if rendered else fallback


def _status(value: object) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip().lower()


async def build_daily_summary_report(
    *,
    database: Any,
    owner_id: str,
    report_date: date,
    locale: str | None,
    generated_at: datetime | None = None,
) -> DailySummaryReport:
    """Build one authoritative owner-scoped daily report model.

    Persistence access is intentionally isolated here. Renderers consume the
    immutable model and must never query persistence directly.
    """

    if database is None:
        raise RuntimeError("Database not connected")

    normalized_owner = _normalized_owner_id(owner_id)
    normalized_locale = normalize_report_locale(locale)

    generated = generated_at or datetime.now(UTC)
    generated = (
        generated.replace(tzinfo=UTC)
        if generated.tzinfo is None
        else generated.astimezone(UTC)
    )

    start_of_day = datetime.combine(
        report_date,
        time.min,
        tzinfo=UTC,
    )
    end_of_day = datetime.combine(
        report_date,
        time.max,
        tzinfo=UTC,
    )

    owner_query = {"owner_id": normalized_owner}
    appointment_query = {
        "owner_id": normalized_owner,
        "starts_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat(),
        },
    }

    cursor = database.appointments.find(
        appointment_query
    ).sort("starts_at", 1)
    raw_appointments = await cursor.to_list(
        length=_MAX_APPOINTMENTS
    )

    total_clients = await database.clients.count_documents(
        owner_query
    )
    total_services = await database.services.count_documents(
        owner_query
    )
    total_appointments = (
        await database.appointments.count_documents(owner_query)
    )

    appointments = tuple(
        DailySummaryAppointment(
            starts_at=_text(item.get("starts_at")),
            client_name=_text(item.get("client_name")),
            service_name=_text(item.get("service_name")),
            status=_status(item.get("status")),
            notes=_text(item.get("notes")),
        )
        for item in raw_appointments
    )

    scheduled_count = sum(
        1 for item in appointments if item.status == "scheduled"
    )
    completed_count = sum(
        1 for item in appointments if item.status == "completed"
    )
    cancelled_count = sum(
        1 for item in appointments if item.status == "cancelled"
    )

    return DailySummaryReport(
        owner_id=normalized_owner,
        report_date=report_date,
        generated_at=generated,
        locale=normalized_locale,
        metrics=DailySummaryMetrics(
            total_clients=total_clients,
            total_services=total_services,
            total_appointments=total_appointments,
            appointments_on_date=len(appointments),
            scheduled_on_date=scheduled_count,
            completed_on_date=completed_count,
            cancelled_on_date=cancelled_count,
        ),
        appointments=appointments,
    )
