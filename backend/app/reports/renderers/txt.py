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
    from app.reports.renderers import document_i18n as _presentation_i18n
    from app.reports.contracts import ReportDocument
    from app.reports.renderers.document_i18n import (
        format_value,
        format_warning,
        label_for,
        report_title,
        text,
        theme_label,
    )

    if not isinstance(document, ReportDocument):
        raise TypeError("document must be a ReportDocument")

    currency = _presentation_i18n.presentation_currency(document)
    currency_text = currency if isinstance(currency, str) else None
    period = (
        f"{document.period.start_date.isoformat()} - "
        f"{document.period.end_date.isoformat()}"
    )
    lines = [
        f"{text(document.locale, 'brand')} · "
        f"{report_title(document.locale, document.report_type)}",
        f"{text(document.locale, 'period')}: {period}",
        f"{text(document.locale, 'timezone')}: {document.period.timezone}",
        f"{text(document.locale, 'generated_at')}: "
        f"{document.generated_at.strftime('%Y-%m-%d %H:%M UTC')}",
        f"{text(document.locale, 'locale')}: {document.locale.upper()}",
        f"{text(document.locale, 'theme')}: "
        f"{theme_label(document.locale, document.theme_id)}",
    ]
    if document.applied_filters:
        lines.append(
            f"{text(document.locale, 'filters')}: "
            + ", ".join(
                f"{label_for(document.locale, str(key))}: "
                f"{format_value(document.locale, str(key), value, currency=currency_text)}"
                for key, value in document.applied_filters.items()
            )
        )
    lines.extend(
        [
            "",
            text(document.locale, "metrics"),
        ]
    )
    lines.extend(
        f"- {label_for(document.locale, str(key))}: "
        f"{format_value(document.locale, str(key), value, currency=currency_text)}"
        for key, value in _presentation_i18n.presentation_metric_items(document)
    )
    if document.columns:
        lines.extend(
            [
                "",
                text(document.locale, "rows"),
                "\t".join(
                    label_for(document.locale, value)
                    for value in document.columns
                ),
            ]
        )
        lines.extend(
            "\t".join(
                format_value(
                    document.locale,
                    document.columns[index],
                    value,
                    currency=currency_text,
                )
                for index, value in enumerate(row)
            )
            for row in _presentation_i18n.presentation_rows(document)
        )
    if document.warnings:
        lines.extend(
            [
                "",
                text(document.locale, "warnings"),
            ]
        )
        lines.extend(
            f"- {format_warning(document.locale, warning)}"
            for warning in document.warnings
        )
    return ("\n".join(lines) + "\n").encode("utf-8")
