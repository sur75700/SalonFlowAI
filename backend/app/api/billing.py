from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.services.billing import get_billing_plans, get_subscription_status, set_subscription_plan

router = APIRouter()


class SetPlanRequest(BaseModel):
    plan: str


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
