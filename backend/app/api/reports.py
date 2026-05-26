from datetime import UTC, date, datetime, time
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()


PDF_TRANSLATIONS = {
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
}


def normalize_locale(value: str | None) -> str:
    if value in {"en", "hy", "ru"}:
        return value
    return "en"


def pdf_text(locale: str, key: str) -> str:
    return PDF_TRANSLATIONS.get(locale, PDF_TRANSLATIONS["en"]).get(
        key,
        PDF_TRANSLATIONS["en"].get(key, key),
    )


def pdf_status(locale: str, value: str | None) -> str:
    status = (value or "").lower()
    if status in {"scheduled", "completed", "cancelled"}:
        return pdf_text(locale, status)
    return value or "-"


def resolve_pdf_fonts() -> tuple[str, str]:
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf"),
    ]
    bold_candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf"),
    ]

    regular = next((item for item in candidates if item.exists()), None)
    bold = next((item for item in bold_candidates if item.exists()), None)

    if regular and bold:
        try:
            pdfmetrics.registerFont(TTFont("SalonFlowSans", str(regular)))
            pdfmetrics.registerFont(TTFont("SalonFlowSansBold", str(bold)))
            return "SalonFlowSans", "SalonFlowSansBold"
        except Exception:
            pass

    return "Helvetica", "Helvetica-Bold"


def fmt_dt(value: str | None) -> str:
    if not value:
        return "-"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.astimezone(UTC).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return value


@router.get("/daily-summary/pdf")
async def export_daily_summary_pdf(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    _: dict = Depends(require_auth),
):
    locale = normalize_locale(locale)

    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        report_date = (
            datetime.strptime(date_str, "%Y-%m-%d").date()
            if date_str
            else datetime.now(UTC).date()
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    start_of_day = datetime.combine(report_date, time.min, tzinfo=UTC)
    end_of_day = datetime.combine(report_date, time.max, tzinfo=UTC)

    start_iso = start_of_day.isoformat()
    end_iso = end_of_day.isoformat()

    appointments = await db.appointments.find(
        {"starts_at": {"$gte": start_iso, "$lte": end_iso}}
    ).sort("starts_at", 1).to_list(length=500)

    total_clients = await db.clients.count_documents({})
    total_services = await db.services.count_documents({})
    total_appointments = await db.appointments.count_documents({})
    today_appointments = len(appointments)
    scheduled_count = sum(1 for x in appointments if x.get("status") == "scheduled")
    completed_count = sum(1 for x in appointments if x.get("status") == "completed")
    cancelled_count = sum(1 for x in appointments if x.get("status") == "cancelled")

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    regular_font, bold_font = resolve_pdf_fonts()

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
    table_header_style = ParagraphStyle(
        "TableHeaderCustom",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )
    table_cell_style = ParagraphStyle(
        "TableCellCustom",
        parent=styles["Normal"],
        fontName=regular_font,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#222222"),
    )

    def table_cell(value: object, bold: bool = False) -> Paragraph:
        return Paragraph(str(value), table_header_style if bold else table_cell_style)

    story = []

    story.append(Paragraph(pdf_text(locale, "title"), title_style))
    story.append(
        Paragraph(
            f'{pdf_text(locale, "report_date")}: {report_date.isoformat()}',
            meta_style,
        )
    )
    story.append(
        Paragraph(
            f'{pdf_text(locale, "generated_at")}: '
            f"{datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}",
            meta_style,
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph(pdf_text(locale, "overview"), section_style))

    overview_rows = [
        [table_cell(pdf_text(locale, "metric"), True), table_cell(pdf_text(locale, "value"), True)],
        [table_cell(pdf_text(locale, "total_clients")), table_cell(total_clients)],
        [table_cell(pdf_text(locale, "total_services")), table_cell(total_services)],
        [table_cell(pdf_text(locale, "total_appointments")), table_cell(total_appointments)],
        [table_cell(pdf_text(locale, "appointments_on_date")), table_cell(today_appointments)],
        [table_cell(pdf_text(locale, "scheduled_on_date")), table_cell(scheduled_count)],
        [table_cell(pdf_text(locale, "completed_on_date")), table_cell(completed_count)],
        [table_cell(pdf_text(locale, "cancelled_on_date")), table_cell(cancelled_count)],
    ]

    overview_table = Table(
        overview_rows,
        colWidths=[95 * mm, 55 * mm],
        hAlign="LEFT",
    )
    overview_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), bold_font),
                ("FONTNAME", (0, 1), (-1, -1), regular_font),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEADING", (0, 0), (-1, -1), 13),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("ALIGN", (1, 1), (1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(overview_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph(pdf_text(locale, "appointments"), section_style))

    if not appointments:
        story.append(Paragraph(pdf_text(locale, "no_appointments"), body_style))
    else:
        rows = [[
            table_cell(pdf_text(locale, "start"), True),
            table_cell(pdf_text(locale, "client"), True),
            table_cell(pdf_text(locale, "service"), True),
            table_cell(pdf_text(locale, "status"), True),
            table_cell(pdf_text(locale, "notes"), True),
        ]]
        for item in appointments:
            rows.append(
                [
                    table_cell(fmt_dt(item.get("starts_at"))),
                    table_cell(item.get("client_name") or "-"),
                    table_cell(item.get("service_name") or "-"),
                    table_cell(pdf_status(locale, item.get("status"))),
                    table_cell((item.get("notes") or "-")[:70]),
                ]
            )

        appointments_table = Table(
            rows,
            colWidths=[28 * mm, 38 * mm, 42 * mm, 24 * mm, 48 * mm],
            repeatRows=1,
            hAlign="LEFT",
        )
        appointments_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7C3AED")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), bold_font),
                    ("FONTNAME", (0, 1), (-1, -1), regular_font),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LEADING", (0, 0), (-1, -1), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(appointments_table)

    doc.build(story)
    buffer.seek(0)

    filename = f"salonflow_daily_summary_{locale}_{report_date.isoformat()}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)
