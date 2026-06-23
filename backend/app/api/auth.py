from datetime import UTC, datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from app.api.deps import require_auth
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import get_database
from app.core.config import settings
from app.services.email import send_email

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr


async def create_email_verification_token(db, admin_id: str, email: str) -> str:
    now = datetime.now(UTC)
    token = secrets.token_urlsafe(32)

    await db.email_verification_tokens.update_many(
        {"admin_id": admin_id, "used_at": None},
        {"$set": {"used_at": now.isoformat(), "superseded_at": now.isoformat()}},
    )

    await db.email_verification_tokens.insert_one(
        {
            "admin_id": admin_id,
            "email": email,
            "token": token,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "used_at": None,
        }
    )

    return token


def build_verification_link(token: str) -> str:
    return f"{settings.public_app_url.rstrip('/')}/verify-email?token={token}"


async def send_verification_email(email: str, token: str) -> dict:
    link = build_verification_link(token)
    html = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Verify your SalonFlow AI email</h2>
      <p>Welcome to SalonFlow AI. Please verify your email to secure your workspace.</p>
      <p>
        <a href="{link}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>{link}</p>
      <p>This link expires in 24 hours.</p>
    </div>
    """
    return await send_email(email, "Verify your SalonFlow AI email", html)


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
    admin_id = str(result.inserted_id)
    verification_token = await create_email_verification_token(db, admin_id, email)
    verification_email = await send_verification_email(email, verification_token)
    token = create_access_token(admin_id)

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
        "verification_email": verification_email,
    }



@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    auth: dict = Depends(require_auth),
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    admin_id = auth.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    current_password = payload.current_password.strip()
    new_password = payload.new_password.strip()

    password_hash = user.get("password_hash")
    if not password_hash or not verify_password(current_password, password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    if verify_password(new_password, password_hash):
        raise HTTPException(status_code=400, detail="New password must be different")

    now = datetime.now(UTC).isoformat()

    await db.admin_users.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": now,
                "password_changed_at": now,
            }
        },
    )

    return {"ok": True, "message": "Password changed successfully"}


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

@router.post("/resend-verification")
async def resend_verification(payload: ResendVerificationRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    email = payload.email.lower().strip()
    user = await db.admin_users.find_one({"email": email})

    if user is None:
        return {"ok": True, "message": "If the account exists, a verification email has been sent"}

    if bool(user.get("email_verified", False)):
        return {"ok": True, "message": "Email is already verified"}

    token = await create_email_verification_token(db, str(user["_id"]), email)
    result = await send_verification_email(email, token)

    return {
        "ok": True,
        "message": "Verification email sent",
        "email_result": result,
    }


@router.get("/verify-email")
async def verify_email(token: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    now = datetime.now(UTC)

    token_doc = await db.email_verification_tokens.find_one(
        {
            "token": token,
            "used_at": None,
        }
    )

    if token_doc is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    expires_at_raw = token_doc.get("expires_at")
    try:
        expires_at = datetime.fromisoformat(expires_at_raw).astimezone(UTC)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    admin_id = token_doc.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    await db.admin_users.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$set": {
                "email_verified": True,
                "email_verified_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
        },
    )

    await db.email_verification_tokens.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used_at": now.isoformat()}},
    )

    return {"ok": True, "message": "Email verified successfully"}

