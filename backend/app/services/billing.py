from datetime import UTC, datetime

import stripe

from app.core.config import settings

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

VALID_PLAN_CODES = set(PLAN_FEATURES.keys())


def is_billing_ready() -> bool:
    return settings.stripe_ready


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
        "billing_ready": is_billing_ready(),
    }


async def ensure_subscription(db, admin_id: str) -> dict:
    now = datetime.now(UTC)

    subscription = await db.subscriptions.find_one({"admin_id": admin_id})

    if subscription is not None:
        return subscription

    doc = {
        "admin_id": admin_id,
        "plan": "business",
        "status": "active",
        "provider": "internal",
        "customer_id": None,
        "subscription_id": None,
        "expires_at": None,
        "created_at": now,
        "updated_at": now,
        "source": "auto_seed",
    }

    result = await db.subscriptions.insert_one(doc)
    created = await db.subscriptions.find_one({"_id": result.inserted_id})
    return created or doc


async def get_subscription_status(db, admin_id: str) -> dict:
    subscription = await ensure_subscription(db, admin_id)

    plan = subscription.get("plan", "free")
    status = subscription.get("status", "inactive")
    provider = subscription.get("provider", "internal")
    expires_at = subscription.get("expires_at")
    source = subscription.get("source", "database")

    return {
        "plan": plan,
        "status": status,
        "provider": provider,
        "features": PLAN_FEATURES.get(plan, PLAN_FEATURES["free"]),
        "expires_at": expires_at,
        "source": source,
        "billing_ready": is_billing_ready(),
        "updated_at": datetime.now(UTC).isoformat(),
    }


async def set_subscription_plan(db, admin_id: str, plan: str) -> dict:
    if plan not in VALID_PLAN_CODES:
        raise ValueError("Invalid subscription plan")

    now = datetime.now(UTC)
    await ensure_subscription(db, admin_id)

    await db.subscriptions.update_one(
        {"admin_id": admin_id},
        {
            "$set": {
                "plan": plan,
                "status": "active",
                "provider": "internal",
                "updated_at": now,
                "source": "internal_admin_update",
            }
        },
    )

    updated = await db.subscriptions.find_one({"admin_id": admin_id})
    return updated or {}



def get_stripe_price_id(plan: str) -> str:
    if plan not in settings.stripe_price_map:
        raise ValueError("Invalid subscription plan")

    price_id = settings.stripe_price_map.get(plan, "").strip()

    if not price_id:
        raise ValueError("Stripe price is not configured for this plan")

    return price_id


def create_checkout_session(admin_id: str, plan: str, success_url: str, cancel_url: str) -> dict:
    if not settings.stripe_ready:
        raise RuntimeError("Stripe billing is not configured")

    price_id = get_stripe_price_id(plan)
    stripe.api_key = settings.stripe_secret_key

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[
            {
                "price": price_id,
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=admin_id,
        metadata={
            "admin_id": admin_id,
            "plan": plan,
        },
    )

    return {
        "session_id": session.id,
        "checkout_url": session.url,
        "plan": plan,
    }
