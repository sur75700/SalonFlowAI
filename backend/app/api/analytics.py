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


def build_revenue_forecast(revenue_last_7_days: list[dict]):
    completed_days = [
        float(day.get("completed_revenue") or 0)
        for day in revenue_last_7_days
    ]

    active_days = [value for value in completed_days if value > 0]
    daily_average = sum(active_days) / len(active_days) if active_days else 0

    first_half = sum(completed_days[:3])
    second_half = sum(completed_days[-3:])

    trend = "stable"
    if second_half > first_half and second_half > 0:
        trend = "up"
    elif second_half < first_half and first_half > 0:
        trend = "down"

    confidence = 72
    if len(active_days) >= 5:
        confidence = 88
    elif len(active_days) >= 3:
        confidence = 82
    elif len(active_days) >= 1:
        confidence = 76

    if trend == "stable":
        confidence = max(68, confidence - 4)

    return {
        "revenue_7_days": round(daily_average * 7, 2),
        "revenue_30_days": round(daily_average * 30, 2),
        "confidence": confidence,
        "trend": trend,
    }


def risk_level_from_score(score: int):
    if score >= 85:
        return "critical"
    if score >= 70:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def build_risk_summary(
    *,
    completed_revenue: float,
    scheduled_pipeline: float,
    cancelled_value: float,
    top_services: list[dict],
    revenue_last_7_days: list[dict],
):
    risks = []

    total_signal = completed_revenue + scheduled_pipeline + cancelled_value
    cancellation_ratio = cancelled_value / total_signal if total_signal else 0

    if cancellation_ratio >= 0.15:
        risks.append({
            "code": "cancellation_risk",
            "score": min(100, round(cancellation_ratio * 100 * 3)),
        })

    if total_signal > 0 and top_services:
        top_revenue = float(top_services[0].get("revenue") or 0)
        concentration_ratio = top_revenue / total_signal
        if concentration_ratio >= 0.6:
            risks.append({
                "code": "service_concentration_risk",
                "score": min(100, round(concentration_ratio * 100)),
            })

    completed_days = [
        float(day.get("completed_revenue") or 0)
        for day in revenue_last_7_days
    ]

    if len(completed_days) >= 2:
        first_half = sum(completed_days[:3])
        second_half = sum(completed_days[-3:])
        if second_half < first_half and first_half > 0:
            slowdown_ratio = (first_half - second_half) / first_half
            risks.append({
                "code": "revenue_slowdown_risk",
                "score": min(100, round(slowdown_ratio * 100)),
            })

    highest = max(risks, key=lambda item: item["score"], default=None)

    return {
        "active_risks": len(risks),
        "highest_risk_code": highest["code"] if highest else "none",
        "highest_risk_score": highest["score"] if highest else 0,
        "risk_level": risk_level_from_score(highest["score"]) if highest else "low",
    }


def growth_level_from_score(score: int):
    if score >= 85:
        return "elite"
    if score >= 70:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def build_growth_summary(
    *,
    completed_revenue: float,
    scheduled_pipeline: float,
    avg_booking_value: float,
    top_services: list[dict],
    revenue_last_7_days: list[dict],
):
    completed_days = [
        float(day.get("completed_revenue") or 0)
        for day in revenue_last_7_days
    ]

    first_half = sum(completed_days[:3])
    second_half = sum(completed_days[-3:])
    trend_bonus = 15 if second_half > first_half and second_half > 0 else 0

    leader = top_services[0] if top_services else {}
    best_service = leader.get("service_name") or "No service yet"
    best_service_revenue = float(leader.get("revenue") or 0)

    pipeline_bonus = 15 if scheduled_pipeline > completed_revenue else 0
    service_bonus = 20 if best_service_revenue > 0 else 0
    ticket_bonus = 10 if avg_booking_value > 0 else 0

    growth_score = min(
        100,
        45 + trend_bonus + pipeline_bonus + service_bonus + ticket_bonus,
    )

    growth_opportunity = round(
        scheduled_pipeline * 0.25 +
        best_service_revenue * 0.2 +
        avg_booking_value * 5,
        2,
    )

    recommended_action = "promote_top_service" if best_service_revenue > 0 else "create_first_booking"
    if scheduled_pipeline > completed_revenue:
        recommended_action = "follow_up_scheduled_clients"

    return {
        "growth_score": growth_score,
        "growth_level": growth_level_from_score(growth_score),
        "best_service": best_service,
        "growth_opportunity": growth_opportunity,
        "recommended_action": recommended_action,
    }


def build_client_summary(
    *,
    clients: list[dict],
    appointments: list[dict],
):
    now = datetime.now(UTC)
    new_cutoff = now - timedelta(days=30)
    inactive_cutoff = now - timedelta(days=60)

    appointment_counts: dict[str, int] = defaultdict(int)
    client_revenue: dict[str, float] = defaultdict(float)
    last_seen: dict[str, datetime] = {}

    for item in appointments:
        client_id = str(item.get("client_id") or "")
        if not client_id:
            continue

        appointment_counts[client_id] += 1

        if (item.get("status") or "").lower() == "completed":
            client_revenue[client_id] += float(item.get("price_snapshot") or 0)

        starts_at = parse_dt(item.get("starts_at"))
        if starts_at and (client_id not in last_seen or starts_at > last_seen[client_id]):
            last_seen[client_id] = starts_at

    total_clients = len(clients)

    new_clients = 0
    returning_clients = 0
    vip_clients = 0
    inactive_clients = 0

    average_revenue = (
        sum(client_revenue.values()) / max(1, len([v for v in client_revenue.values() if v > 0]))
    )

    for client in clients:
        client_id = str(client.get("_id") or "")

        created_at = parse_dt(client.get("created_at"))
        if created_at and created_at >= new_cutoff:
            new_clients += 1

        visits = appointment_counts.get(client_id, 0)
        revenue = client_revenue.get(client_id, 0.0)

        if visits >= 2:
            returning_clients += 1

        if visits >= 5 or (average_revenue > 0 and revenue >= average_revenue):
            vip_clients += 1

        last_visit = last_seen.get(client_id)
        if last_visit is None or last_visit < inactive_cutoff:
            inactive_clients += 1

    retention_score = round(
        returning_clients / total_clients * 100,
        0,
    ) if total_clients else 0

    return {
        "total_clients": total_clients,
        "new_clients": new_clients,
        "returning_clients": returning_clients,
        "vip_clients": vip_clients,
        "inactive_clients": inactive_clients,
        "retention_score": retention_score,
    }


def decision_level_from_score(score: int):
    if score >= 85:
        return "execute"
    if score >= 70:
        return "accelerate"
    if score >= 45:
        return "monitor"
    return "stabilize"


def build_executive_decision(
    *,
    forecast: dict,
    risk_summary: dict,
    growth_summary: dict,
):
    growth_score = int(growth_summary.get("growth_score") or 0)
    risk_score = int(risk_summary.get("highest_risk_score") or 0)
    forecast_confidence = int(forecast.get("confidence") or 0)

    decision_score = max(
        0,
        min(
            100,
            round(
                growth_score * 0.5 +
                forecast_confidence * 0.3 -
                risk_score * 0.2
            ),
        ),
    )

    primary_action = (
        growth_summary.get("recommended_action")
        or "follow_up_scheduled_clients"
    )

    secondary_action = "promote_top_service"

    expected_impact = round(
        float(growth_summary.get("growth_opportunity") or 0),
        2,
    )

    headline = "Growth opportunity detected"

    if risk_score >= 70:
        headline = "Risk mitigation required"

    return {
        "decision_score": decision_score,
        "decision_level": decision_level_from_score(decision_score),
        "headline": headline,
        "primary_action": primary_action,
        "secondary_action": secondary_action,
        "expected_impact": expected_impact,
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
            "code": "empty_waiting_for_data",
            "params": {},
            "action_code": "create_first_booking",
            "action_params": {},
            "priority_level": "medium",
            "confidence": 88,
            "impact_code": "activate_revenue_visibility",
            "title": "AI command center is waiting for data",
            "message": "Create completed or scheduled bookings to unlock revenue intelligence.",
            "priority": 1,
        })
    else:
        if scheduled_pipeline > completed_revenue:
            insights.append({
                "type": "growth",
                "tone": "success",
                "code": "pipeline_stronger_than_revenue",
                "params": {},
                "action_code": "follow_up_scheduled_clients",
                "action_params": {},
                "priority_level": "high",
                "confidence": 91,
                "impact_code": "protect_pipeline_revenue",
                "opportunity_code": "convert_pipeline_revenue",
                "opportunity_amount": round(scheduled_pipeline * 0.35, 2),
                "title": "Scheduled pipeline is stronger than completed revenue",
                "message": "Upcoming bookings are ahead of completed revenue. Focus on converting scheduled visits into completed revenue.",
                "priority": 1,
            })

        if cancellation_ratio >= 0.15:
            insights.append({
                "type": "risk",
                "tone": "warning",
                "code": "cancellation_value_attention",
                "params": {"percent": round(cancellation_ratio * 100)},
                "action_code": "enable_reminders",
                "action_params": {},
                "priority_level": "high",
                "confidence": 94,
                "impact_code": "reduce_cancellations",
                "opportunity_code": "recover_cancelled_revenue",
                "opportunity_amount": round(cancelled_value * 0.5, 2),
                "title": "Cancellation value needs attention",
                "message": f"Cancelled value is about {round(cancellation_ratio * 100)}% of visible booking value. Review cancellation reasons and reminders.",
                "priority": 2,
            })

        if top_services:
            leader = top_services[0]
            insights.append({
                "type": "service",
                "tone": "success",
                "code": "top_service_leading_revenue",
                "action_code": "promote_top_service",
                "action_params": {"service": leader.get("service_name", "Top service")},
                "priority_level": "medium",
                "confidence": 90,
                "impact_code": "increase_service_revenue",
                "opportunity_code": "increase_service_revenue",
                "opportunity_amount": round(float(leader.get("revenue") or 0) * 0.2, 2),
                "params": {
                    "service": leader.get("service_name", "Top service"),
                    "revenue": round(float(leader.get("revenue") or 0), 2),
                    "bookings": leader.get("bookings_count", 0),
                },
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
                    "code": "revenue_trend_improving",
                    "params": {},
                    "action_code": "scale_winning_service",
                    "action_params": {},
                    "priority_level": "medium",
                    "confidence": 86,
                    "impact_code": "scale_growth_momentum",
                    "title": "Revenue trend is improving",
                    "message": "The latest days are stronger than the start of the week. Keep pushing the winning services.",
                    "priority": 4,
                })
            elif second_half < first_half and first_half > 0:
                insights.append({
                    "type": "trend",
                    "tone": "warning",
                    "code": "revenue_momentum_slowed",
                    "params": {},
                    "action_code": "launch_reactivation_campaign",
                    "action_params": {},
                    "priority_level": "high",
                    "confidence": 84,
                    "impact_code": "recover_revenue_momentum",
                    "opportunity_code": "recover_revenue_momentum",
                    "opportunity_amount": round(max(first_half - second_half, 0), 2),
                    "title": "Revenue momentum slowed",
                    "message": "Recent completed revenue is lower than the start of the week. Consider promotions or follow-ups.",
                    "priority": 4,
                })

        if avg_booking_value > 0:
            insights.append({
                "type": "ticket",
                "tone": "neutral",
                "code": "average_ticket_visible",
                "params": {"value": round(avg_booking_value, 2)},
                "action_code": "create_upsell_bundle",
                "action_params": {"baseline": round(avg_booking_value, 2)},
                "priority_level": "low",
                "confidence": 82,
                "impact_code": "lift_average_ticket",
                "opportunity_code": "increase_average_ticket",
                "opportunity_amount": round(avg_booking_value * 5, 2),
                "title": "Average completed ticket is visible",
                "message": f"Average completed booking value is {round(avg_booking_value, 2)} AMD. Use this as the baseline for upsell strategy.",
                "priority": 5,
            })

    return sorted(insights, key=lambda item: item["priority"])[:5]


@router.get("/insights")
async def analytics_insights(_: dict = Depends(require_auth)):
    dashboard = await analytics_dashboard(_)
    db = get_database()
    clients = []
    appointments = []
    if db is not None:
        clients = await db.clients.find().to_list(length=5000)
        appointments = await db.appointments.find().to_list(length=5000)

    totals = dashboard.get("totals", {})
    revenue_last_7_days = dashboard.get("revenue_last_7_days") or []
    insights = build_business_insights(
        completed_revenue=float(totals.get("completed_revenue") or 0),
        scheduled_pipeline=float(totals.get("scheduled_pipeline") or 0),
        cancelled_value=float(totals.get("cancelled_value") or 0),
        avg_booking_value=float(totals.get("avg_completed_booking_value") or 0),
        top_services=dashboard.get("top_services") or [],
        revenue_last_7_days=revenue_last_7_days,
    )
    forecast = build_revenue_forecast(revenue_last_7_days)
    risk_summary = build_risk_summary(
        completed_revenue=float(totals.get("completed_revenue") or 0),
        scheduled_pipeline=float(totals.get("scheduled_pipeline") or 0),
        cancelled_value=float(totals.get("cancelled_value") or 0),
        top_services=dashboard.get("top_services") or [],
        revenue_last_7_days=revenue_last_7_days,
    )
    growth_summary = build_growth_summary(
        completed_revenue=float(totals.get("completed_revenue") or 0),
        scheduled_pipeline=float(totals.get("scheduled_pipeline") or 0),
        avg_booking_value=float(totals.get("avg_completed_booking_value") or 0),
        top_services=dashboard.get("top_services") or [],
        revenue_last_7_days=revenue_last_7_days,
    )

    executive_decision = build_executive_decision(
        forecast=forecast,
        risk_summary=risk_summary,
        growth_summary=growth_summary,
    )
    client_summary = build_client_summary(
        clients=clients,
        appointments=appointments,
    )

    return {
        "currency": dashboard.get("currency", "AMD"),
        "generated_at": datetime.now(UTC).isoformat(),
        "forecast": forecast,
        "risk_summary": risk_summary,
        "growth_summary": growth_summary,
        "executive_decision": executive_decision,
        "client_summary": client_summary,
        "insights": insights,
    }
