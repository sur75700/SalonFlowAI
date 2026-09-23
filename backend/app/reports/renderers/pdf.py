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
PDF_THEME_PALETTES = {
    "royal_cosmos": {
        "hero": "#17133C",
        "hero_deep": "#0B0922",
        "accent": "#8B72FF",
        "accent_soft": "#EEE9FF",
        "surface": "#F8F7FF",
        "surface_alt": "#F1EEFF",
        "line": "#D9D2FF",
        "ink": "#17152D",
        "muted": "#5F5A78",
        "footer": "#5F5A78",
    },
    "royal_gold_cosmos": {
        "hero": "#19131E",
        "hero_deep": "#08070B",
        "accent": "#C89B3C",
        "accent_soft": "#FBF2D9",
        "surface": "#FCFAF3",
        "surface_alt": "#F6F0DF",
        "line": "#E6D6AE",
        "ink": "#1E1820",
        "muted": "#71656F",
        "footer": "#71656F",
    },
}


def render_report_document_pdf(document: object) -> bytes:
    from app.reports.renderers import document_i18n as _presentation_i18n
    from io import BytesIO
    from xml.sax.saxutils import escape

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        KeepTogether,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

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

    theme_id = getattr(document, "theme_id", "royal_cosmos")
    palette = PDF_THEME_PALETTES.get(theme_id, PDF_THEME_PALETTES["royal_cosmos"])
    page_size = landscape(A4) if len(document.columns) > 6 else A4
    page_width, page_height = page_size
    left_margin = 17 * mm
    right_margin = 17 * mm
    top_margin = 20 * mm
    bottom_margin = 18 * mm
    content_width = page_width - left_margin - right_margin

    buffer = BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        rightMargin=right_margin,
        leftMargin=left_margin,
        topMargin=top_margin,
        bottomMargin=bottom_margin,
        title=f"SalonFlowAI - {report_title(document.locale, document.report_type)}",
        author="SalonFlowAI",
        subject=report_title(document.locale, document.report_type),
        creator="SalonFlowAI Reports",
        invariant=1,
    )

    regular_font, bold_font = _resolve_pdf_fonts()
    styles = getSampleStyleSheet()

    def paragraph(value: object, style: ParagraphStyle) -> Paragraph:
        safe = escape("" if value is None else str(value)).replace("\n", "<br/>")
        return Paragraph(safe, style)

    header_kicker = ParagraphStyle(
        "ReportV2Kicker",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=8,
        leading=10,
        textColor=colors.HexColor(
            "#D7CFFF" if theme_id == "royal_cosmos" else "#E8C982"
        ),
        spaceAfter=4,
    )
    header_title = ParagraphStyle(
        "ReportV2HeaderTitle",
        parent=styles["Title"],
        fontName=bold_font,
        fontSize=21 if page_size == A4 else 23,
        leading=26 if page_size == A4 else 28,
        textColor=colors.white,
        spaceAfter=4,
    )
    header_meta = ParagraphStyle(
        "ReportV2HeaderMeta",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor(
            "#D9D5EE" if theme_id == "royal_cosmos" else "#E8DFCB"
        ),
    )
    section_style = ParagraphStyle(
        "ReportV2Section",
        parent=styles["Heading2"],
        fontName=bold_font,
        fontSize=12,
        leading=15,
        textColor=colors.HexColor(palette["hero"]),
        spaceBefore=8,
        spaceAfter=6,
    )
    meta_label_style = ParagraphStyle(
        "ReportV2MetaLabel",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=8,
        leading=10,
        textColor=colors.HexColor(palette["muted"]),
    )
    meta_value_style = ParagraphStyle(
        "ReportV2MetaValue",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor(palette["ink"]),
    )
    table_header_style = ParagraphStyle(
        "ReportV2TableHeader",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=8.2 if len(document.columns) <= 5 else 7.4,
        leading=10,
        textColor=colors.white,
    )
    table_cell_style = ParagraphStyle(
        "ReportV2TableCell",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=8.5 if len(document.columns) <= 5 else 7.6,
        leading=10,
        textColor=colors.HexColor(palette["ink"]),
    )
    table_value_style = ParagraphStyle(
        "ReportV2TableValue",
        parent=table_cell_style,
        alignment=2,
        fontName=bold_font,
    )
    warning_style = ParagraphStyle(
        "ReportV2Warning",
        parent=table_cell_style,
        textColor=colors.HexColor(palette["ink"]),
    )

    period = (
        f"{document.period.start_date.isoformat()} - "
        f"{document.period.end_date.isoformat()}"
    )
    generated = document.generated_at.strftime("%Y-%m-%d %H:%M UTC")
    currency = _presentation_i18n.presentation_currency(document)
    currency_text = currency if isinstance(currency, str) else None
    theme_label_text = theme_label(document.locale, theme_id)
    title = report_title(document.locale, document.report_type)

    header = Table(
        [[
            [
                paragraph(text(document.locale, "brand"), header_kicker),
                paragraph(title, header_title),
                paragraph(
                    f"{period}  |  {document.period.timezone}",
                    header_meta,
                ),
            ]
        ]],
        colWidths=[content_width],
    )
    header.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(palette["hero"])),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor(palette["accent"])),
                ("LEFTPADDING", (0, 0), (-1, -1), 13),
                ("RIGHTPADDING", (0, 0), (-1, -1), 13),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    accent_rule = Table(
        [[""]],
        colWidths=[content_width],
        rowHeights=[2.2 * mm],
    )
    accent_rule.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(palette["accent"])),
                ("LINEBELOW", (0, 0), (-1, -1), 0, colors.transparent),
            ]
        )
    )

    metadata_rows = [
        [
            paragraph(text(document.locale, "period"), meta_label_style),
            paragraph(period, meta_value_style),
        ],
        [
            paragraph(text(document.locale, "timezone"), meta_label_style),
            paragraph(document.period.timezone, meta_value_style),
        ],
        [
            paragraph(text(document.locale, "generated_at"), meta_label_style),
            paragraph(generated, meta_value_style),
        ],
        [
            paragraph(text(document.locale, "locale"), meta_label_style),
            paragraph(document.locale.upper(), meta_value_style),
        ],
        [
            paragraph(text(document.locale, "theme"), meta_label_style),
            paragraph(theme_label_text, meta_value_style),
        ],
    ]
    if document.applied_filters:
        filter_text = ", ".join(
            f"{label_for(document.locale, str(key))}: "
            f"{format_value(document.locale, str(key), value, currency=currency_text)}"
            for key, value in document.applied_filters.items()
        )
        metadata_rows.append(
            [
                paragraph(text(document.locale, "filters"), meta_label_style),
                paragraph(filter_text, meta_value_style),
            ]
        )
    metadata = Table(
        metadata_rows,
        colWidths=[38 * mm, content_width - 38 * mm],
        hAlign="LEFT",
    )
    metadata.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(palette["surface"])),
                (
                    "ROWBACKGROUNDS",
                    (0, 0),
                    (-1, -1),
                    [
                        colors.HexColor(palette["surface"]),
                        colors.HexColor(palette["surface_alt"]),
                    ],
                ),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor(palette["line"])),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story = [
        header,
        accent_rule,
        Spacer(1, 7),
        metadata,
        Spacer(1, 11),
        paragraph(text(document.locale, "metrics"), section_style),
    ]

    metric_rows = [
        [
            paragraph(text(document.locale, "metric"), table_header_style),
            paragraph(text(document.locale, "value"), table_header_style),
        ]
    ]
    metric_rows.extend(
        [
            paragraph(label_for(document.locale, str(key)), table_cell_style),
            paragraph(
                format_value(
                    document.locale,
                    str(key),
                    value,
                    currency=currency_text,
                ),
                table_value_style,
            ),
        ]
        for key, value in _presentation_i18n.presentation_metric_items(document)
    )
    if len(metric_rows) > 1:
        metric_table = Table(
            metric_rows,
            colWidths=[content_width * 0.62, content_width * 0.38],
            repeatRows=1,
            hAlign="LEFT",
        )
        metric_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor(palette["hero_deep"]),
                    ),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [
                            colors.HexColor(palette["surface"]),
                            colors.HexColor(palette["surface_alt"]),
                        ],
                    ),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor(palette["line"])),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(metric_table)

    if document.columns:
        story.extend(
            [
                Spacer(1, 11),
                paragraph(text(document.locale, "rows"), section_style),
            ]
        )
        table_rows = [
            [
                paragraph(label_for(document.locale, value), table_header_style)
                for value in document.columns
            ]
        ]
        table_rows.extend(
            [
                paragraph(
                    format_value(
                        document.locale,
                        document.columns[index],
                        value,
                        currency=currency_text,
                    ),
                    table_cell_style,
                )
                for index, value in enumerate(row)
            ]
            for row in _presentation_i18n.presentation_rows(document)
        )
        if len(document.columns) <= 6:
            width_presets = {
                1: [1.0],
                2: [0.62, 0.38],
                3: [0.30, 0.42, 0.28],
                4: [0.18, 0.34, 0.22, 0.26],
                5: [0.17, 0.22, 0.24, 0.16, 0.21],
                6: [0.18, 0.18, 0.16, 0.12, 0.16, 0.20],
            }
            weights = width_presets[len(document.columns)]
            column_widths = [content_width * weight for weight in weights]
        else:
            column_widths = [content_width / len(document.columns)] * len(document.columns)
        rows_table = Table(
            table_rows,
            colWidths=column_widths,
            repeatRows=1,
            hAlign="LEFT",
        )
        rows_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor(palette["hero_deep"]),
                    ),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor(palette["surface"])],
                    ),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor(palette["line"])),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(rows_table)

    if document.warnings:
        story.extend(
            [
                Spacer(1, 9),
                paragraph(text(document.locale, "warnings"), section_style),
            ]
        )
        warning_rows = [
            [paragraph(format_warning(document.locale, warning), warning_style)]
            for warning in document.warnings
        ]
        warning_table = Table(warning_rows, colWidths=[content_width])
        warning_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor(palette["accent_soft"]),
                    ),
                    ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor(palette["accent"])),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(KeepTogether(warning_table))

    def draw_page(canvas, _doc) -> None:
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor(palette["accent"]))
        canvas.setLineWidth(0.55)
        canvas.line(
            left_margin,
            page_height - 10 * mm,
            page_width - right_margin,
            page_height - 10 * mm,
        )
        canvas.setFont(regular_font, 7.5)
        canvas.setFillColor(colors.HexColor(palette["footer"]))
        canvas.drawString(
            left_margin,
            9 * mm,
            text(document.locale, "footer"),
        )
        canvas.drawRightString(
            page_width - right_margin,
            9 * mm,
            f"{generated}  |  {_doc.page}",
        )
        canvas.restoreState()

    pdf.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buffer.getvalue()
