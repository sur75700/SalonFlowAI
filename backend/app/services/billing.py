from datetime import UTC, datetime

PLAN_FEATURES = {
    "free": [
        "dashboard",
        "appointments",
        "clients",
        "services",
        "basic_analytics",
    ],
    "pro": [
        "dashboard",
        "appointments",
        "clients",
        "services",
        "reports",
        "basic_analytics",
        "ai_forecast",
        "growth_insights",
        "risk_center",
        "client_intelligence",
    ],
    "business": [
        "dashboard",
        "appointments",
        "clients",
        "services",
        "reports",
        "basic_analytics",
        "ai_forecast",
        "growth_insights",
        "risk_center",
        "client_intelligence",
        "mission_control",
        "performance_center",
        "benchmark_center",
        "revenue_simulator",
        "opportunity_matrix",
    ],
    "enterprise": [
        "dashboard",
        "appointments",
        "clients",
        "services",
        "reports",
        "basic_analytics",
        "ai_forecast",
        "growth_insights",
        "risk_center",
        "client_intelligence",
        "mission_control",
        "performance_center",
        "benchmark_center",
        "revenue_simulator",
        "opportunity_matrix",
        "multi_location",
        "advanced_ai",
        "priority_support",
    ],
}

PRICING_PLANS = [
    {
        "code": "free",
        "name": "Free",
        "monthly_price": 0,
        "currency": "USD",
        "highlighted": False,
    },
    {
        "code": "pro",
        "name": "Pro",
        "monthly_price": 19,
        "currency": "USD",
        "highlighted": False,
    },
    {
        "code": "business",
        "name": "Business",
        "monthly_price": 49,
        "currency": "USD",
        "highlighted": True,
    },
    {
        "code": "enterprise",
        "name": "Enterprise",
        "monthly_price": None,
        "currency": "USD",
        "highlighted": False,
    },
]


def get_billing_plans() -> dict:
    return {
        "plans": [
            {
                **plan,
                "features": PLAN_FEATURES[plan["code"]],
            }
            for plan in PRICING_PLANS
        ],
        "provider": "internal",
        "billing_ready": False,
    }


async def get_subscription_status(db, admin_id: str) -> dict:
    subscription = None

    if db is not None:
        subscription = await db.subscriptions.find_one({"admin_id": admin_id})

    if subscription is None:
        plan = "business"
        status = "active"
        provider = "internal"
        expires_at = None
        source = "demo_default"
    else:
        plan = subscription.get("plan", "free")
        status = subscription.get("status", "inactive")
        provider = subscription.get("provider", "internal")
        expires_at = subscription.get("expires_at")
        source = "database"

    return {
        "plan": plan,
        "status": status,
        "provider": provider,
        "features": PLAN_FEATURES.get(plan, PLAN_FEATURES["free"]),
        "expires_at": expires_at,
        "source": source,
        "billing_ready": False,
        "updated_at": datetime.now(UTC).isoformat(),
    }
