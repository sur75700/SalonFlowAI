from datetime import UTC, datetime
import os

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


async def get_subscription_status(db, admin_id: str) -> dict | None:
    subscription = await db.subscriptions.find_one({"admin_id": admin_id})

    if subscription is None:
        return None

    plan = subscription.get("plan")
    if plan not in VALID_PLAN_CODES:
        raise ValueError("Invalid persisted subscription plan")

    status = subscription.get("status", "inactive")
    provider = subscription.get("provider", "internal")
    expires_at = subscription.get("expires_at")

    return {
        "plan": plan,
        "status": status,
        "provider": provider,
        "features": PLAN_FEATURES[plan],
        "expires_at": expires_at,
        "source": "stripe" if provider == "stripe" else "organization",
        "billing_ready": is_billing_ready(),
        "updated_at": datetime.now(UTC).isoformat(),
    }


async def set_subscription_plan(db, admin_id: str, plan: str) -> dict:
    if plan not in VALID_PLAN_CODES:
        raise ValueError("Invalid subscription plan")

    now = datetime.now(UTC)

    await db.subscriptions.update_one(
        {"admin_id": admin_id},
        {
            "$set": {
                "admin_id": admin_id,
                "plan": plan,
                "status": "active",
                "provider": "internal",
                "customer_id": None,
                "subscription_id": None,
                "expires_at": None,
                "updated_at": now,
                "source": "internal_operator_update",
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    updated = await db.subscriptions.find_one({"admin_id": admin_id})
    return updated or {}


def _billing_return_url_bases() -> tuple[str, ...]:
    values = [
        settings.frontend_web_origin,
        settings.frontend_localhost_origin,
        settings.frontend_lan_origin,
        settings.public_app_url,
        *os.getenv("BILLING_ALLOWED_RETURN_URLS", "").split(","),
    ]

    cleaned: list[str] = []
    for raw in values:
        value = raw.strip().rstrip("/")
        if value and value not in cleaned:
            cleaned.append(value)

    return tuple(cleaned)


def validate_billing_return_url(value: str) -> str:
    candidate = (value or "").strip()
    if not candidate:
        raise ValueError("Billing return URL is required")

    for base in _billing_return_url_bases():
        if candidate == base or candidate.startswith(base + "/") or candidate.startswith(base + "?"):
            return candidate

    raise ValueError("Billing return URL is not allowed")


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

    success_url = validate_billing_return_url(success_url)
    cancel_url = validate_billing_return_url(cancel_url)
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




async def create_customer_portal_session(db, admin_id: str, return_url: str) -> dict:
    if not settings.stripe_ready:
        raise RuntimeError("Stripe billing is not configured")

    return_url = validate_billing_return_url(return_url)
    subscription = await db.subscriptions.find_one({"admin_id": admin_id})
    customer_id = (subscription or {}).get("customer_id")

    if not customer_id:
        raise ValueError("Stripe customer was not found for this account")

    stripe.api_key = settings.stripe_secret_key

    portal_session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )

    return {
        "portal_url": portal_session.url,
        "customer_id": customer_id,
    }


def normalize_stripe_plan(raw_plan: str | None) -> str:
    plan = (raw_plan or "").strip()

    if plan in VALID_PLAN_CODES:
        return plan

    raise ValueError("Unknown Stripe plan mapping")


async def sync_checkout_session_completed(db, session: dict) -> dict:
    admin_id = session.get("client_reference_id") or session.get("metadata", {}).get("admin_id")
    plan = normalize_stripe_plan(session.get("metadata", {}).get("plan"))

    if not admin_id:
        return {"synced": False, "reason": "missing_admin_id"}

    now = datetime.now(UTC)

    await db.subscriptions.update_one(
        {"admin_id": admin_id},
        {
            "$set": {
                "admin_id": admin_id,
                "plan": plan,
                "status": "active",
                "provider": "stripe",
                "customer_id": session.get("customer"),
                "subscription_id": session.get("subscription"),
                "updated_at": now,
                "source": "stripe_checkout_completed",
            },
            "$setOnInsert": {
                "created_at": now,
                "expires_at": None,
            },
        },
        upsert=True,
    )

    return {"synced": True, "admin_id": admin_id, "plan": plan}


async def sync_stripe_subscription_event(db, subscription: dict, event_type: str) -> dict:
    subscription_id = subscription.get("id")
    customer_id = subscription.get("customer")
    status = subscription.get("status", "inactive")
    metadata = subscription.get("metadata", {}) or {}
    admin_id = metadata.get("admin_id")
    raw_plan = metadata.get("plan")

    existing = None
    if subscription_id:
        existing = await db.subscriptions.find_one({"subscription_id": subscription_id})

    if not admin_id and existing:
        admin_id = existing.get("admin_id")

    if raw_plan:
        plan = normalize_stripe_plan(raw_plan)
    elif existing and existing.get("plan") in VALID_PLAN_CODES:
        plan = existing["plan"]
    else:
        raise ValueError("Unknown Stripe plan mapping")

    if not admin_id:
        return {"synced": False, "reason": "missing_admin_id"}

    now = datetime.now(UTC)
    source = "stripe_subscription_deleted" if event_type == "customer.subscription.deleted" else "stripe_subscription_updated"

    await db.subscriptions.update_one(
        {"admin_id": admin_id},
        {
            "$set": {
                "plan": plan,
                "status": status,
                "provider": "stripe",
                "customer_id": customer_id,
                "subscription_id": subscription_id,
                "updated_at": now,
                "source": source,
            },
            "$setOnInsert": {
                "admin_id": admin_id,
                "created_at": now,
                "expires_at": None,
            },
        },
        upsert=True,
    )

    return {"synced": True, "admin_id": admin_id, "plan": plan, "status": status}


async def is_stripe_event_processed(db, event_id: str) -> bool:
    if not event_id:
        return False

    existing = await db.processed_stripe_events.find_one({"event_id": event_id})
    return existing is not None


async def mark_stripe_event_processed(db, event: dict, sync_result: dict) -> None:
    event_id = event.get("id")
    event_type = event.get("type", "unknown")

    if not event_id:
        return

    now = datetime.now(UTC)

    await db.processed_stripe_events.update_one(
        {"event_id": event_id},
        {
            "$setOnInsert": {
                "event_id": event_id,
                "event_type": event_type,
                "processed_at": now,
                "sync": sync_result,
                "source": "stripe_webhook",
            }
        },
        upsert=True,
    )


async def dispatch_stripe_event(db, event: dict) -> dict:
    event_id = event.get("id", "")
    event_type = event.get("type", "unknown")
    data_object = event.get("data", {}).get("object", {})

    if await is_stripe_event_processed(db, event_id):
        return {
            "received": True,
            "event": event_type,
            "handled": True,
            "duplicate": True,
            "sync": {"synced": False, "reason": "duplicate_event"},
        }

    sync_result = {"synced": False, "reason": "event_not_syncable"}

    if event_type == "checkout.session.completed":
        sync_result = await sync_checkout_session_completed(db, data_object)
    elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        sync_result = await sync_stripe_subscription_event(db, data_object, event_type)
    elif event_type in {"invoice.payment_succeeded", "invoice.payment_failed"}:
        sync_result = {"synced": False, "reason": "invoice_sync_pending"}

    supported_events = {
        "checkout.session.completed",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
    }

    await mark_stripe_event_processed(db, event, sync_result)

    return {
        "received": True,
        "event": event_type,
        "handled": event_type in supported_events,
        "duplicate": False,
        "sync": sync_result,
    }


async def handle_stripe_webhook(db, payload: bytes, signature: str | None) -> dict:
    if not settings.stripe_webhook_secret.strip():
        raise RuntimeError("Stripe webhook is not configured")

    if not signature:
        raise ValueError("Missing Stripe signature")

    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError:
        raise ValueError("Invalid Stripe payload") from None
    except stripe.SignatureVerificationError:
        raise ValueError("Invalid Stripe signature") from None

    return await dispatch_stripe_event(db, event._to_dict_recursive())
