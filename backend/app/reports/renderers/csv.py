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

# PHASE_63D_REPORT_DOCUMENT_RENDERER
def render_report_document_csv(document: object) -> bytes:
    from app.reports.renderers import document_i18n as _presentation_i18n
    import csv
    from io import StringIO

    from app.reports.contracts import ReportDocument
    from app.reports.renderers.document_i18n import (
        export_value,
        format_warning,
        label_for,
        report_title,
        text,
        theme_label,
    )

    if not isinstance(document, ReportDocument):
        raise TypeError("document must be a ReportDocument")

    def safe(value: object) -> str:
        text = "" if value is None else str(value)
        return f"'{text}" if text.startswith(("=", "+", "-", "@")) else text

    output = StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(
        [
            text(document.locale, "brand"),
            safe(report_title(document.locale, document.report_type)),
        ]
    )
    writer.writerow([text(document.locale, "period"), safe(
        f"{document.period.start_date.isoformat()} - {document.period.end_date.isoformat()}"
    )])
    writer.writerow([text(document.locale, "timezone"), safe(document.period.timezone)])
    writer.writerow([
        text(document.locale, "generated_at"),
        safe(document.generated_at.strftime("%Y-%m-%d %H:%M UTC")),
    ])
    writer.writerow([text(document.locale, "locale"), safe(document.locale.upper())])
    writer.writerow([
        text(document.locale, "theme"),
        safe(theme_label(document.locale, document.theme_id)),
    ])
    if document.applied_filters:
        for key, value in document.applied_filters.items():
            writer.writerow([
                label_for(document.locale, str(key)),
                safe(export_value(document.locale, str(key), value)),
            ])
    writer.writerow([])
    writer.writerow([text(document.locale, "metric"), text(document.locale, "value")])
    for key, value in _presentation_i18n.presentation_metric_items(document):
        writer.writerow([
            label_for(document.locale, str(key)),
            safe(export_value(document.locale, str(key), value)),
        ])
    if document.columns:
        writer.writerow([])
        writer.writerow([label_for(document.locale, value) for value in document.columns])
        for row in _presentation_i18n.presentation_rows(document):
            writer.writerow([
                safe(export_value(document.locale, document.columns[index], value))
                for index, value in enumerate(row)
            ])
    if document.warnings:
        writer.writerow([])
        writer.writerow([text(document.locale, "warnings")])
        for warning in document.warnings:
            writer.writerow([format_warning(document.locale, warning)])
    return ("\ufeff" + output.getvalue()).encode("utf-8")
