import os

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.services.billing import create_checkout_session, create_customer_portal_session, get_billing_plans, get_subscription_status, handle_stripe_webhook, set_subscription_plan

router = APIRouter()



def _billing_operator_mutation_enabled() -> bool:
    return os.getenv("BILLING_OPERATOR_MUTATION_ENABLED", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _billing_operator_email_set() -> set[str]:
    return {
        value.strip().lower()
        for value in os.getenv("BILLING_OPERATOR_EMAILS", "").split(",")
        if value.strip()
    }


async def _require_billing_operator(db, auth: object) -> None:
    if not _billing_operator_mutation_enabled():
        raise HTTPException(
            status_code=403,
            detail={"code": "billing_operator_required"},
        )

    admin_id = auth.get("admin_id") if isinstance(auth, dict) else None
    if not isinstance(admin_id, str) or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    email = (user or {}).get("email")
    normalized = email.strip().lower() if isinstance(email, str) else ""

    if not normalized or normalized not in _billing_operator_email_set():
        raise HTTPException(
            status_code=403,
            detail={"code": "billing_operator_required"},
        )


class SetPlanRequest(BaseModel):
    plan: str


class CreateCheckoutSessionRequest(BaseModel):
    plan: str
    success_url: str
    cancel_url: str


class CustomerPortalRequest(BaseModel):
    return_url: str


@router.get("/plans")
async def billing_plans():
    return get_billing_plans()


@router.get("/status")
async def billing_status(auth=Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        status = await get_subscription_status(db, auth["admin_id"])
    except ValueError:
        raise HTTPException(
            status_code=409,
            detail={"code": "invalid_subscription_state"},
        ) from None

    if status is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "subscription_not_provisioned"},
        )

    return status



@router.post("/admin/set-plan")
async def billing_admin_set_plan(payload: SetPlanRequest, auth=Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    await _require_billing_operator(db, auth)

    try:
        await set_subscription_plan(db, auth["admin_id"], payload.plan)
        status = await get_subscription_status(db, auth["admin_id"])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription plan") from None

    if status is None:
        raise HTTPException(status_code=500, detail="Subscription update failed")

    return status



@router.post("/create-checkout-session")
async def billing_create_checkout_session(
    payload: CreateCheckoutSessionRequest,
    auth=Depends(require_auth),
):
    try:
        return create_checkout_session(
            admin_id=auth["admin_id"],
            plan=payload.plan,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None



@router.post("/customer-portal")
async def billing_customer_portal(
    payload: CustomerPortalRequest,
    auth=Depends(require_auth),
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        return await create_customer_portal_session(
            db=db,
            admin_id=auth["admin_id"],
            return_url=payload.return_url,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None


@router.post("/webhook")
async def billing_stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    payload = await request.body()

    try:
        return await handle_stripe_webhook(db, payload, stripe_signature)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
