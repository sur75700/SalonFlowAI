from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal, cast


ReportLocale = Literal["en", "hy", "ru", "fr"]
SUPPORTED_REPORT_LOCALES = frozenset({"en", "hy", "ru", "fr"})


def normalize_report_locale(value: str | None) -> ReportLocale:
    normalized = value.strip().lower() if isinstance(value, str) else ""
    if normalized in SUPPORTED_REPORT_LOCALES:
        return cast(ReportLocale, normalized)
    return "en"


@dataclass(frozen=True, slots=True)
class DailySummaryAppointment:
    starts_at: str
    client_name: str
    service_name: str
    status: str
    notes: str


@dataclass(frozen=True, slots=True)
class DailySummaryMetrics:
    total_clients: int
    total_services: int
    total_appointments: int
    appointments_on_date: int
    scheduled_on_date: int
    completed_on_date: int
    cancelled_on_date: int


@dataclass(frozen=True, slots=True)
class DailySummaryReport:
    owner_id: str
    report_date: date
    generated_at: datetime
    locale: ReportLocale
    metrics: DailySummaryMetrics
    appointments: tuple[DailySummaryAppointment, ...]
