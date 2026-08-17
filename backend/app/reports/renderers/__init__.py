from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.reports.models import ReportLocale


REPORT_TRANSLATIONS: dict[str, dict[str, str]] = {
    "en": {
        "title": "SalonFlow AI - Daily Summary Report",
        "report_date": "Report date",
        "generated_at": "Generated at",
        "overview": "Overview",
        "metric": "Metric",
        "value": "Value",
        "total_clients": "Total clients",
        "total_services": "Total services",
        "total_appointments": "Total appointments",
        "appointments_on_date": "Appointments on report date",
        "scheduled_on_date": "Scheduled on report date",
        "completed_on_date": "Completed on report date",
        "cancelled_on_date": "Cancelled on report date",
        "appointments": "Appointments",
        "no_appointments": "No appointments found for this date.",
        "start": "Start",
        "client": "Client",
        "service": "Service",
        "status": "Status",
        "notes": "Notes",
        "scheduled": "Scheduled",
        "completed": "Completed",
        "cancelled": "Cancelled",
    },
    "hy": {
        "title": "SalonFlow AI - Օրական ամփոփ հաշվետվություն",
        "report_date": "Հաշվետվության ամսաթիվ",
        "generated_at": "Ստեղծվել է",
        "overview": "Ամփոփում",
        "metric": "Ցուցիչ",
        "value": "Արժեք",
        "total_clients": "Ընդհանուր հաճախորդներ",
        "total_services": "Ընդհանուր ծառայություններ",
        "total_appointments": "Ընդհանուր ամրագրումներ",
        "appointments_on_date": "Ամրագրումներ ընտրված օրը",
        "scheduled_on_date": "Պլանավորված ընտրված օրը",
        "completed_on_date": "Ավարտված ընտրված օրը",
        "cancelled_on_date": "Չեղարկված ընտրված օրը",
        "appointments": "Ամրագրումներ",
        "no_appointments": "Այս ամսաթվի համար ամրագրումներ չեն գտնվել։",
        "start": "Սկիզբ",
        "client": "Հաճախորդ",
        "service": "Ծառայություն",
        "status": "Կարգավիճակ",
        "notes": "Նշումներ",
        "scheduled": "Պլանավորված",
        "completed": "Ավարտված",
        "cancelled": "Չեղարկված",
    },
    "ru": {
        "title": "SalonFlow AI - Ежедневный сводный отчет",
        "report_date": "Дата отчета",
        "generated_at": "Создано",
        "overview": "Сводка",
        "metric": "Показатель",
        "value": "Значение",
        "total_clients": "Всего клиентов",
        "total_services": "Всего услуг",
        "total_appointments": "Всего записей",
        "appointments_on_date": "Записи на выбранную дату",
        "scheduled_on_date": "Запланировано на дату",
        "completed_on_date": "Завершено на дату",
        "cancelled_on_date": "Отменено на дату",
        "appointments": "Записи",
        "no_appointments": "На эту дату записи не найдены.",
        "start": "Начало",
        "client": "Клиент",
        "service": "Услуга",
        "status": "Статус",
        "notes": "Заметки",
        "scheduled": "Запланировано",
        "completed": "Завершено",
        "cancelled": "Отменено",
    },
    "fr": {
        "title": "SalonFlow AI - Rapport quotidien",
        "report_date": "Date du rapport",
        "generated_at": "Généré le",
        "overview": "Vue d’ensemble",
        "metric": "Indicateur",
        "value": "Valeur",
        "total_clients": "Total des clients",
        "total_services": "Total des services",
        "total_appointments": "Total des réservations",
        "appointments_on_date": "Réservations à la date sélectionnée",
        "scheduled_on_date": "Planifiées à cette date",
        "completed_on_date": "Terminées à cette date",
        "cancelled_on_date": "Annulées à cette date",
        "appointments": "Réservations",
        "no_appointments": "Aucune réservation trouvée pour cette date.",
        "start": "Début",
        "client": "Client",
        "service": "Service",
        "status": "Statut",
        "notes": "Notes",
        "scheduled": "Planifié",
        "completed": "Terminé",
        "cancelled": "Annulé",
    },
}


def report_text(locale: ReportLocale, key: str) -> str:
    english = REPORT_TRANSLATIONS["en"]
    return REPORT_TRANSLATIONS.get(locale, english).get(
        key,
        english.get(key, key),
    )


def report_status(locale: ReportLocale, value: str) -> str:
    status = value.strip().lower()
    if status in {"scheduled", "completed", "cancelled"}:
        return report_text(locale, status)
    return value or "-"


def format_report_datetime(value: str) -> str:
    if not value:
        return "-"
    try:
        parsed = datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )
    except ValueError:
        return value

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    else:
        parsed = parsed.astimezone(UTC)

    return parsed.strftime("%Y-%m-%d %H:%M")


def spreadsheet_safe(value: Any) -> str:
    text = "" if value is None else str(value)
    if text.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


from app.reports.renderers.csv import render_daily_summary_csv
from app.reports.renderers.docx import render_daily_summary_docx
from app.reports.renderers.pdf import render_daily_summary_pdf
from app.reports.renderers.txt import render_daily_summary_txt
from app.reports.renderers.xlsx import render_daily_summary_xlsx


__all__ = [
    "REPORT_TRANSLATIONS",
    "format_report_datetime",
    "render_daily_summary_csv",
    "render_daily_summary_docx",
    "render_daily_summary_pdf",
    "render_daily_summary_txt",
    "render_daily_summary_xlsx",
    "report_status",
    "report_text",
    "spreadsheet_safe",
]
