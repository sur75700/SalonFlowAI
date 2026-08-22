from __future__ import annotations

from app.reports.models import DailySummaryReport
from app.reports.renderers import (
    format_report_datetime,
    report_status,
    report_text,
)


def render_daily_summary_txt(report: DailySummaryReport) -> bytes:
    locale = report.locale
    metrics = report.metrics

    lines = [
        report_text(locale, "title"),
        f'{report_text(locale, "report_date")}: {report.report_date.isoformat()}',
        f'{report_text(locale, "generated_at")}: {report.generated_at.strftime("%Y-%m-%d %H:%M UTC")}',
        "",
        report_text(locale, "overview"),
        f'{report_text(locale, "total_clients")}: {metrics.total_clients}',
        f'{report_text(locale, "total_services")}: {metrics.total_services}',
        f'{report_text(locale, "total_appointments")}: {metrics.total_appointments}',
        f'{report_text(locale, "appointments_on_date")}: {metrics.appointments_on_date}',
        f'{report_text(locale, "scheduled_on_date")}: {metrics.scheduled_on_date}',
        f'{report_text(locale, "completed_on_date")}: {metrics.completed_on_date}',
        f'{report_text(locale, "cancelled_on_date")}: {metrics.cancelled_on_date}',
        "",
        report_text(locale, "appointments"),
    ]

    if not report.appointments:
        lines.append(report_text(locale, "no_appointments"))
    else:
        for index, item in enumerate(report.appointments, start=1):
            lines.extend(
                [
                    f"#{index}",
                    f'{report_text(locale, "start")}: {format_report_datetime(item.starts_at)}',
                    f'{report_text(locale, "client")}: {item.client_name}',
                    f'{report_text(locale, "service")}: {item.service_name}',
                    f'{report_text(locale, "status")}: {report_status(locale, item.status)}',
                    f'{report_text(locale, "notes")}: {item.notes}',
                    "",
                ]
            )

    return ("\n".join(lines).rstrip() + "\n").encode("utf-8")

# PHASE_63D_REPORT_DOCUMENT_RENDERER
def render_report_document_txt(document: object) -> bytes:
    from app.reports.contracts import ReportDocument

    if not isinstance(document, ReportDocument):
        raise TypeError("document must be a ReportDocument")

    lines = [
        document.report_type,
        (
            f"{document.period.start_date.isoformat()} .. "
            f"{document.period.end_date.isoformat()}"
        ),
        f"timezone: {document.period.timezone}",
        f"locale: {document.locale}",
        "",
        "metrics:",
    ]
    lines.extend(
        f"- {key}: {value}"
        for key, value in document.metrics.items()
    )
    if document.columns:
        lines.extend(("", "\t".join(document.columns)))
        lines.extend(
            "\t".join("" if value is None else str(value) for value in row)
            for row in document.rows
        )
    if document.warnings:
        lines.extend(("", "warnings:"))
        lines.extend(f"- {warning}" for warning in document.warnings)
    return ("\n".join(lines) + "\n").encode("utf-8")
