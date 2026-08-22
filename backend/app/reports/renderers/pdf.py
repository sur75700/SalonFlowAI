from __future__ import annotations

from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.reports.models import DailySummaryReport
from app.reports.renderers import (
    format_report_datetime,
    report_status,
    report_text,
)


def _resolve_pdf_fonts() -> tuple[str, str]:
    regular_candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf"),
    ]
    bold_candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf"),
    ]

    regular = next((p for p in regular_candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), None)

    if regular and bold:
        try:
            pdfmetrics.registerFont(TTFont("SalonFlowSans", str(regular)))
            pdfmetrics.registerFont(TTFont("SalonFlowSansBold", str(bold)))
            return "SalonFlowSans", "SalonFlowSansBold"
        except Exception:
            pass

    return "Helvetica", "Helvetica-Bold"


def render_daily_summary_pdf(report: DailySummaryReport) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        invariant=1,
    )

    regular_font, bold_font = _resolve_pdf_fonts()
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName=bold_font,
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#111111"),
        spaceAfter=10,
    )
    meta_style = ParagraphStyle(
        "MetaCustom",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#555555"),
        spaceAfter=6,
    )
    section_style = ParagraphStyle(
        "SectionCustom",
        parent=styles["Heading2"],
        fontName=bold_font,
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#222222"),
        spaceBefore=8,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#222222"),
    )
    header_style = ParagraphStyle(
        "TableHeaderCustom",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )
    cell_style = ParagraphStyle(
        "TableCellCustom",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#222222"),
    )

    def cell(value: object, *, header: bool = False) -> Paragraph:
        return Paragraph(
            escape(str(value)),
            header_style if header else cell_style,
        )

    locale = report.locale
    metrics = report.metrics

    story = [
        Paragraph(escape(report_text(locale, "title")), title_style),
        Paragraph(
            escape(
                f'{report_text(locale, "report_date")}: '
                f"{report.report_date.isoformat()}"
            ),
            meta_style,
        ),
        Paragraph(
            escape(
                f'{report_text(locale, "generated_at")}: '
                f"{report.generated_at.strftime('%Y-%m-%d %H:%M UTC')}"
            ),
            meta_style,
        ),
        Spacer(1, 6),
        Paragraph(escape(report_text(locale, "overview")), section_style),
    ]

    overview_rows = [
        [cell(report_text(locale, "metric"), header=True), cell(report_text(locale, "value"), header=True)],
        [cell(report_text(locale, "total_clients")), cell(metrics.total_clients)],
        [cell(report_text(locale, "total_services")), cell(metrics.total_services)],
        [cell(report_text(locale, "total_appointments")), cell(metrics.total_appointments)],
        [cell(report_text(locale, "appointments_on_date")), cell(metrics.appointments_on_date)],
        [cell(report_text(locale, "scheduled_on_date")), cell(metrics.scheduled_on_date)],
        [cell(report_text(locale, "completed_on_date")), cell(metrics.completed_on_date)],
        [cell(report_text(locale, "cancelled_on_date")), cell(metrics.cancelled_on_date)],
    ]

    overview = Table(
        overview_rows,
        colWidths=[95 * mm, 55 * mm],
        hAlign="LEFT",
    )
    overview.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.extend(
        [
            overview,
            Spacer(1, 12),
            Paragraph(
                escape(report_text(locale, "appointments")),
                section_style,
            ),
        ]
    )

    if not report.appointments:
        story.append(
            Paragraph(
                escape(report_text(locale, "no_appointments")),
                body_style,
            )
        )
    else:
        rows = [[
            cell(report_text(locale, "start"), header=True),
            cell(report_text(locale, "client"), header=True),
            cell(report_text(locale, "service"), header=True),
            cell(report_text(locale, "status"), header=True),
            cell(report_text(locale, "notes"), header=True),
        ]]

        for item in report.appointments:
            rows.append(
                [
                    cell(format_report_datetime(item.starts_at)),
                    cell(item.client_name),
                    cell(item.service_name),
                    cell(report_status(locale, item.status)),
                    cell(item.notes[:70]),
                ]
            )

        table = Table(
            rows,
            colWidths=[28 * mm, 38 * mm, 42 * mm, 24 * mm, 48 * mm],
            repeatRows=1,
            hAlign="LEFT",
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7C3AED")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(table)

    document.build(story)
    return buffer.getvalue()

# PHASE_63D_REPORT_DOCUMENT_RENDERER
def render_report_document_pdf(document: object) -> bytes:
    from io import BytesIO
    from xml.sax.saxutils import escape

    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table

    from app.reports.contracts import ReportDocument

    if not isinstance(document, ReportDocument):
        raise TypeError("document must be a ReportDocument")

    buffer = BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        invariant=1,
    )
    regular_font, bold_font = _resolve_pdf_fonts()
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportV2Title",
        parent=styles["Title"],
        fontName=bold_font,
        fontSize=18,
        leading=22,
    )
    body_style = ParagraphStyle(
        "ReportV2Body",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=9,
        leading=12,
    )
    header_style = ParagraphStyle(
        "ReportV2Header",
        parent=body_style,
        fontName=bold_font,
    )

    story = [
        Paragraph(escape(document.report_type), title_style),
        Paragraph(
            escape(
                f"{document.period.start_date.isoformat()} .. "
                f"{document.period.end_date.isoformat()} "
                f"({document.period.timezone})"
            ),
            body_style,
        ),
        Spacer(1, 8),
    ]
    metric_rows = [
        [
            Paragraph(escape(str(key)), header_style),
            Paragraph(escape(str(value)), body_style),
        ]
        for key, value in document.metrics.items()
    ]
    if metric_rows:
        story.append(Table(metric_rows, repeatRows=0))
        story.append(Spacer(1, 8))

    if document.columns:
        table_rows = [
            [
                Paragraph(escape(str(value)), header_style)
                for value in document.columns
            ]
        ]
        table_rows.extend(
            [
                Paragraph(
                    escape("" if value is None else str(value)),
                    body_style,
                )
                for value in row
            ]
            for row in document.rows
        )
        story.append(Table(table_rows, repeatRows=1))

    pdf.build(story)
    return buffer.getvalue()
