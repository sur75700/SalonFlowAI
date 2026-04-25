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
