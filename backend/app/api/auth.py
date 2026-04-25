from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.security import create_access_token, verify_password
from app.db.mongo import get_database

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    user = await db.admin_users.find_one({"email": payload.email.lower()})
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    password_hash = user.get("password_hash")
    if not password_hash or not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user["_id"]))

    await db.admin_users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "last_login_at": datetime.now(UTC).isoformat(),
            }
        },
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
        },
    }
