from __future__ import annotations

import csv
from io import StringIO

from app.reports.models import DailySummaryReport
from app.reports.renderers import (
    format_report_datetime,
    report_status,
    report_text,
    spreadsheet_safe,
)


def render_daily_summary_csv(report: DailySummaryReport) -> bytes:
    locale = report.locale
    metrics = report.metrics

    buffer = StringIO(newline="")
    writer = csv.writer(buffer, lineterminator="\n")

    writer.writerow([report_text(locale, "metric"), report_text(locale, "value")])
    writer.writerows(
        [
            [report_text(locale, "report_date"), report.report_date.isoformat()],
            [report_text(locale, "generated_at"), report.generated_at.strftime("%Y-%m-%d %H:%M UTC")],
            [report_text(locale, "total_clients"), metrics.total_clients],
            [report_text(locale, "total_services"), metrics.total_services],
            [report_text(locale, "total_appointments"), metrics.total_appointments],
            [report_text(locale, "appointments_on_date"), metrics.appointments_on_date],
            [report_text(locale, "scheduled_on_date"), metrics.scheduled_on_date],
            [report_text(locale, "completed_on_date"), metrics.completed_on_date],
            [report_text(locale, "cancelled_on_date"), metrics.cancelled_on_date],
        ]
    )

    writer.writerow([])
    writer.writerow(
        [
            report_text(locale, "start"),
            report_text(locale, "client"),
            report_text(locale, "service"),
            report_text(locale, "status"),
            report_text(locale, "notes"),
        ]
    )

    for item in report.appointments:
        writer.writerow(
            [
                spreadsheet_safe(format_report_datetime(item.starts_at)),
                spreadsheet_safe(item.client_name),
                spreadsheet_safe(item.service_name),
                spreadsheet_safe(report_status(locale, item.status)),
                spreadsheet_safe(item.notes),
            ]
        )

    return buffer.getvalue().encode("utf-8-sig")
