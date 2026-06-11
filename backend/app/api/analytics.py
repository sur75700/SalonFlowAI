from datetime import UTC, datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()


def parse_dt(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)
    except Exception:
        return None


@router.get("/dashboard")
async def analytics_dashboard(_: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    appointments = await db.appointments.find().to_list(length=5000)

    total_revenue = 0.0
    completed_revenue = 0.0
    scheduled_pipeline = 0.0
    cancelled_value = 0.0

    service_totals = defaultdict(lambda: {"count": 0, "revenue": 0.0})
    daily_completed = defaultdict(float)

    now = datetime.now(UTC)
    last_7_start = now - timedelta(days=6)

    for item in appointments:
        price = float(item.get("price_snapshot") or 0)
        status = (item.get("status") or "").lower()
        service_name = item.get("service_name") or "Unknown service"
        starts_at = parse_dt(item.get("starts_at"))

        total_revenue += price

        service_totals[service_name]["count"] += 1
        service_totals[service_name]["revenue"] += price

        if status == "completed":
            completed_revenue += price
            if starts_at and starts_at >= last_7_start:
                day_key = starts_at.strftime("%Y-%m-%d")
                daily_completed[day_key] += price

        elif status == "scheduled":
            scheduled_pipeline += price

        elif status == "cancelled":
            cancelled_value += price

    top_services = sorted(
        [
            {
                "service_name": name,
                "bookings_count": values["count"],
                "revenue": round(values["revenue"], 2),
            }
            for name, values in service_totals.items()
        ],
        key=lambda x: (x["revenue"], x["bookings_count"]),
        reverse=True,
    )[:5]

    revenue_last_7_days = []
    for i in range(7):
        day = (last_7_start + timedelta(days=i)).strftime("%Y-%m-%d")
        revenue_last_7_days.append(
            {
                "date": day,
                "completed_revenue": round(daily_completed.get(day, 0.0), 2),
            }
        )

    avg_booking_value = round(
        completed_revenue / max(1, sum(1 for x in appointments if (x.get("status") or "").lower() == "completed")),
        2,
    )

    return {
        "currency": "AMD",
        "totals": {
            "total_revenue_snapshot": round(total_revenue, 2),
            "completed_revenue": round(completed_revenue, 2),
            "scheduled_pipeline": round(scheduled_pipeline, 2),
            "cancelled_value": round(cancelled_value, 2),
            "avg_completed_booking_value": avg_booking_value,
        },
        "top_services": top_services,
        "revenue_last_7_days": revenue_last_7_days,
    }


def build_business_insights(
    *,
    completed_revenue: float,
    scheduled_pipeline: float,
    cancelled_value: float,
    avg_booking_value: float,
    top_services: list[dict],
    revenue_last_7_days: list[dict],
):
    insights = []

    total_signal = completed_revenue + scheduled_pipeline + cancelled_value
    cancellation_ratio = cancelled_value / total_signal if total_signal else 0

    if completed_revenue <= 0 and scheduled_pipeline <= 0:
        insights.append({
            "type": "empty",
            "tone": "neutral",
            "title": "AI command center is waiting for data",
            "message": "Create completed or scheduled bookings to unlock revenue intelligence.",
            "priority": 1,
        })
    else:
        if scheduled_pipeline > completed_revenue:
            insights.append({
                "type": "growth",
                "tone": "success",
                "title": "Scheduled pipeline is stronger than completed revenue",
                "message": "Upcoming bookings are ahead of completed revenue. Focus on converting scheduled visits into completed revenue.",
                "priority": 1,
            })

        if cancellation_ratio >= 0.15:
            insights.append({
                "type": "risk",
                "tone": "warning",
                "title": "Cancellation value needs attention",
                "message": f"Cancelled value is about {round(cancellation_ratio * 100)}% of visible booking value. Review cancellation reasons and reminders.",
                "priority": 2,
            })

        if top_services:
            leader = top_services[0]
            insights.append({
                "type": "service",
                "tone": "success",
                "title": f"{leader.get('service_name', 'Top service')} is leading revenue",
                "message": f"This service generated {round(float(leader.get('revenue') or 0), 2)} AMD across {leader.get('bookings_count', 0)} bookings.",
                "priority": 3,
            })

        completed_days = [
            float(day.get("completed_revenue") or 0)
            for day in revenue_last_7_days
        ]
        if len(completed_days) >= 2:
            first_half = sum(completed_days[:3])
            second_half = sum(completed_days[-3:])
            if second_half > first_half and second_half > 0:
                insights.append({
                    "type": "trend",
                    "tone": "success",
                    "title": "Revenue trend is improving",
                    "message": "The latest days are stronger than the start of the week. Keep pushing the winning services.",
                    "priority": 4,
                })
            elif second_half < first_half and first_half > 0:
                insights.append({
                    "type": "trend",
                    "tone": "warning",
                    "title": "Revenue momentum slowed",
                    "message": "Recent completed revenue is lower than the start of the week. Consider promotions or follow-ups.",
                    "priority": 4,
                })

        if avg_booking_value > 0:
            insights.append({
                "type": "ticket",
                "tone": "neutral",
                "title": "Average completed ticket is visible",
                "message": f"Average completed booking value is {round(avg_booking_value, 2)} AMD. Use this as the baseline for upsell strategy.",
                "priority": 5,
            })

    return sorted(insights, key=lambda item: item["priority"])[:5]


@router.get("/insights")
async def analytics_insights(_: dict = Depends(require_auth)):
    dashboard = await analytics_dashboard(_)

    totals = dashboard.get("totals", {})
    insights = build_business_insights(
        completed_revenue=float(totals.get("completed_revenue") or 0),
        scheduled_pipeline=float(totals.get("scheduled_pipeline") or 0),
        cancelled_value=float(totals.get("cancelled_value") or 0),
        avg_booking_value=float(totals.get("avg_completed_booking_value") or 0),
        top_services=dashboard.get("top_services") or [],
        revenue_last_7_days=dashboard.get("revenue_last_7_days") or [],
    )

    return {
        "currency": dashboard.get("currency", "AMD"),
        "generated_at": datetime.now(UTC).isoformat(),
        "insights": insights,
    }
