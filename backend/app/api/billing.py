from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.services.billing import get_billing_plans, get_subscription_status

router = APIRouter()


@router.get("/plans")
async def billing_plans():
    return get_billing_plans()


@router.get("/status")
async def billing_status(auth=Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    return await get_subscription_status(db, auth["admin_id"])
