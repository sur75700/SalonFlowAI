from __future__ import annotations

from io import BytesIO

from docx import Document

from app.reports.models import DailySummaryReport
from app.reports.renderers import (
    format_report_datetime,
    report_status,
    report_text,
)


def render_daily_summary_docx(report: DailySummaryReport) -> bytes:
    locale = report.locale
    metrics = report.metrics

    document = Document()
    document.add_heading(report_text(locale, "title"), level=0)
    document.add_paragraph(
        f'{report_text(locale, "report_date")}: {report.report_date.isoformat()}'
    )
    document.add_paragraph(
        f'{report_text(locale, "generated_at")}: {report.generated_at.strftime("%Y-%m-%d %H:%M UTC")}'
    )

    document.add_heading(report_text(locale, "overview"), level=1)

    overview = document.add_table(rows=1, cols=2)
    overview.style = "Table Grid"
    header = overview.rows[0].cells
    header[0].text = report_text(locale, "metric")
    header[1].text = report_text(locale, "value")

    for label, value in (
        (report_text(locale, "total_clients"), metrics.total_clients),
        (report_text(locale, "total_services"), metrics.total_services),
        (report_text(locale, "total_appointments"), metrics.total_appointments),
        (report_text(locale, "appointments_on_date"), metrics.appointments_on_date),
        (report_text(locale, "scheduled_on_date"), metrics.scheduled_on_date),
        (report_text(locale, "completed_on_date"), metrics.completed_on_date),
        (report_text(locale, "cancelled_on_date"), metrics.cancelled_on_date),
    ):
        cells = overview.add_row().cells
        cells[0].text = str(label)
        cells[1].text = str(value)

    document.add_heading(report_text(locale, "appointments"), level=1)

    if not report.appointments:
        document.add_paragraph(report_text(locale, "no_appointments"))
    else:
        table = document.add_table(rows=1, cols=5)
        table.style = "Table Grid"
        header = table.rows[0].cells
        header[0].text = report_text(locale, "start")
        header[1].text = report_text(locale, "client")
        header[2].text = report_text(locale, "service")
        header[3].text = report_text(locale, "status")
        header[4].text = report_text(locale, "notes")

        for item in report.appointments:
            cells = table.add_row().cells
            cells[0].text = format_report_datetime(item.starts_at)
            cells[1].text = item.client_name
            cells[2].text = item.service_name
            cells[3].text = report_status(locale, item.status)
            cells[4].text = item.notes

    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()

# PHASE_63D_REPORT_DOCUMENT_RENDERER
def render_report_document_docx(document: object) -> bytes:
    from app.reports.renderers import document_i18n as _presentation_i18n
    from io import BytesIO

    from docx import Document

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

    output = BytesIO()
    report = Document()
    report_title_text = report_title(document.locale, document.report_type)
    report.core_properties.title = report_title_text
    report.core_properties.author = "SalonFlowAI"
    generated = document.generated_at.replace(tzinfo=None)
    report.core_properties.created = generated
    report.core_properties.modified = generated

    report.add_heading(
        f"{text(document.locale, 'brand')} · {report_title_text}",
        level=0,
    )
    report.add_paragraph(
        (
            f"{text(document.locale, 'period')}: "
            f"{document.period.start_date.isoformat()} - "
            f"{document.period.end_date.isoformat()}"
        )
    )
    report.add_paragraph(
        f"{text(document.locale, 'timezone')}: {document.period.timezone}"
    )
    report.add_paragraph(
        f"{text(document.locale, 'generated_at')}: "
        f"{document.generated_at.strftime('%Y-%m-%d %H:%M UTC')}"
    )
    report.add_paragraph(
        f"{text(document.locale, 'locale')}: {document.locale.upper()}"
    )
    report.add_paragraph(
        f"{text(document.locale, 'theme')}: "
        f"{theme_label(document.locale, document.theme_id)}"
    )
    if document.applied_filters:
        report.add_paragraph(
            f"{text(document.locale, 'filters')}: "
            + ", ".join(
                f"{label_for(document.locale, str(key))}: "
                f"{safe(export_value(document.locale, str(key), value))}"
                for key, value in document.applied_filters.items()
            )
        )
    metrics = report.add_table(rows=1, cols=2)
    metrics.rows[0].cells[0].text = text(document.locale, "metric")
    metrics.rows[0].cells[1].text = text(document.locale, "value")
    for key, value in _presentation_i18n.presentation_metric_items(document):
        cells = metrics.add_row().cells
        cells[0].text = label_for(document.locale, str(key))
        cells[1].text = safe(export_value(document.locale, str(key), value))

    if document.columns:
        table = report.add_table(rows=1, cols=len(document.columns))
        for index, value in enumerate(document.columns):
            table.rows[0].cells[index].text = label_for(document.locale, value)
        for row in _presentation_i18n.presentation_rows(document):
            cells = table.add_row().cells
            for index, value in enumerate(row):
                cells[index].text = safe(
                    export_value(document.locale, document.columns[index], value)
                )
    if document.warnings:
        report.add_heading(text(document.locale, "warnings"), level=1)
        for warning in document.warnings:
            report.add_paragraph(format_warning(document.locale, warning))

    report.save(output)
    return output.getvalue()
