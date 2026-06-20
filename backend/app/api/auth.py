from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.api.deps import require_auth
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import get_database

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


@router.post("/register")
async def register(payload: RegisterRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    email = payload.email.lower().strip()
    full_name = payload.full_name.strip()
    password = payload.password.strip()

    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full name is required")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = await db.admin_users.find_one({"email": email})
    if existing is not None:
        raise HTTPException(status_code=409, detail="Account already exists")

    now = datetime.now(UTC).isoformat()

    doc = {
        "email": email,
        "full_name": full_name,
        "password_hash": hash_password(password),
        "role": "owner",
        "email_verified": False,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }

    result = await db.admin_users.insert_one(doc)
    token = create_access_token(str(result.inserted_id))

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": str(result.inserted_id),
            "email": email,
            "full_name": full_name,
            "role": "owner",
            "email_verified": False,
        },
    }


@router.get("/me")
async def get_current_user(auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    admin_id = auth.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["_id"]),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role", "owner"),
        "email_verified": bool(user.get("email_verified", False)),
        "last_login_at": user.get("last_login_at"),
        "created_at": user.get("created_at"),
    }


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
