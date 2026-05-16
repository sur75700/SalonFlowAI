from fastapi import APIRouter, HTTPException
from app.db.mongo import get_database

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def build_analytics_payload():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database is not connected")

    appointments = await db.appointments.find().to_list(1000)

    completed = cancelled = scheduled = 0
    completed_revenue = 0.0
    scheduled_pipeline = 0.0
    cancelled_value = 0.0
    service_totals = {}

    for a in appointments:
        status = a.get("status")
        price = float(a.get("price_snapshot", 0) or 0)
        service_name = a.get("service_name") or "Unknown"

        if status == "completed":
            completed += 1
            completed_revenue += price
            service_totals[service_name] = service_totals.get(service_name, 0.0) + price
        elif status == "cancelled":
            cancelled += 1
            cancelled_value += price
        elif status == "scheduled":
            scheduled += 1
            scheduled_pipeline += price

    avg_completed_ticket = completed_revenue / completed if completed else 0.0
    top_services = [
        {"name": name, "revenue": revenue}
        for name, revenue in sorted(service_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    analytics = {
        "completedRevenue": completed_revenue,
        "scheduledPipeline": scheduled_pipeline,
        "cancelledValue": cancelled_value,
        "avgCompletedTicket": avg_completed_ticket,
        "topPerformingServices": top_services,
        "revenueTrend": [],
    }

    summary = {
        "total_appointments": len(appointments),
        "completed": completed,
        "cancelled": cancelled,
        "scheduled": scheduled,
        "total_revenue": completed_revenue,
        "currency": "AMD",
    }

    return {
        **summary,
        **analytics,
        "completed_revenue": completed_revenue,
        "scheduled_pipeline": scheduled_pipeline,
        "cancelled_value": cancelled_value,
        "avg_completed_ticket": avg_completed_ticket,
        "top_performing_services": top_services,
        "analytics": analytics,
        "summary": summary,
    }


@router.get("/")
async def analytics_root():
    return await build_analytics_payload()


@router.get("/dashboard")
async def analytics_dashboard():
    return await build_analytics_payload()
