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
