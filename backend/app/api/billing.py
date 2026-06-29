from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.services.billing import create_checkout_session, get_billing_plans, get_subscription_status, set_subscription_plan

router = APIRouter()


class SetPlanRequest(BaseModel):
    plan: str


class CreateCheckoutSessionRequest(BaseModel):
    plan: str
    success_url: str
    cancel_url: str


@router.get("/plans")
async def billing_plans():
    return get_billing_plans()


@router.get("/status")
async def billing_status(auth=Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    return await get_subscription_status(db, auth["admin_id"])



@router.post("/admin/set-plan")
async def billing_admin_set_plan(payload: SetPlanRequest, auth=Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        await set_subscription_plan(db, auth["admin_id"], payload.plan)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription plan") from None

    return await get_subscription_status(db, auth["admin_id"])



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
