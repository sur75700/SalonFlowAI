from datetime import UTC, date, datetime, time
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()


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
    _: dict = Depends(require_auth),
):
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

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#111111"),
        spaceAfter=10,
    )
    meta_style = ParagraphStyle(
        "MetaCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#555555"),
        spaceAfter=6,
    )
    section_style = ParagraphStyle(
        "SectionCustom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#222222"),
        spaceBefore=8,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#222222"),
    )

    story = []

    story.append(Paragraph("SalonFlow AI - Daily Summary Report", title_style))
    story.append(Paragraph(f"Report date: {report_date.isoformat()}", meta_style))
    story.append(Paragraph(f"Generated at: {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}", meta_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Overview", section_style))

    overview_rows = [
        ["Metric", "Value"],
        ["Total clients", str(total_clients)],
        ["Total services", str(total_services)],
        ["Total appointments", str(total_appointments)],
        ["Appointments on report date", str(today_appointments)],
        ["Scheduled on report date", str(scheduled_count)],
        ["Completed on report date", str(completed_count)],
        ["Cancelled on report date", str(cancelled_count)],
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
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
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

    story.append(Paragraph("Appointments", section_style))

    if not appointments:
        story.append(Paragraph("No appointments found for this date.", body_style))
    else:
        rows = [["Start", "Client", "Service", "Status", "Notes"]]
        for item in appointments:
            rows.append(
                [
                    fmt_dt(item.get("starts_at")),
                    item.get("client_name") or "-",
                    item.get("service_name") or "-",
                    item.get("status") or "-",
                    (item.get("notes") or "-")[:70],
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
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
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

    filename = f"salonflow_daily_summary_{report_date.isoformat()}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)
