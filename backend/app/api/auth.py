from datetime import UTC, datetime, timedelta
import base64
import secrets

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from bson.binary import Binary
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.api.deps import require_auth
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import get_database
from app.core.config import settings
from app.services.email import send_email

router = APIRouter()


AVATAR_MAX_BYTES = 1_500_000
AVATAR_ALLOWED_MIME = frozenset({
    "image/jpeg",
    "image/png",
    "image/webp",
})


def normalize_avatar_mime(value: str | None) -> str:
    normalized = (value or "").split(";", 1)[0].strip().lower()
    if normalized == "image/jpg":
        return "image/jpeg"
    return normalized


def detect_avatar_mime(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if (
        len(content) >= 12
        and content[0:4] == b"RIFF"
        and content[8:12] == b"WEBP"
    ):
        return "image/webp"
    return None


def resolve_avatar_url(user: dict) -> tuple[str | None, str]:
    custom_blob = user.get("avatar_blob")
    custom_mime = normalize_avatar_mime(user.get("avatar_mime"))

    if custom_blob and custom_mime in AVATAR_ALLOWED_MIME:
        raw = bytes(custom_blob)
        encoded = base64.b64encode(raw).decode("ascii")
        return f"data:{custom_mime};base64,{encoded}", "custom"

    provider_url = str(user.get("provider_avatar_url") or "").strip()
    if provider_url.startswith("https://"):
        return provider_url, "google"

    return None, "initials"


def serialize_current_user(user: dict) -> dict:
    avatar_url, avatar_source = resolve_avatar_url(user)
    return {
        "id": str(user["_id"]),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role", "owner"),
        "email_verified": bool(user.get("email_verified", False)),
        "last_login_at": user.get("last_login_at"),
        "created_at": user.get("created_at"),
        "avatar_url": avatar_url,
        "avatar_source": avatar_source,
    }




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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class AppleLoginRequest(BaseModel):
    identity_token: str
    full_name: str | None = None


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


def build_password_reset_link(token: str) -> str:
    return f"{settings.public_app_url.rstrip('/')}/reset-password?token={token}"


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



async def create_password_reset_token(db, admin_id: str, email: str) -> str:
    now = datetime.now(UTC)
    token = secrets.token_urlsafe(32)

    await db.password_reset_tokens.update_many(
        {"admin_id": admin_id, "used_at": None},
        {"$set": {"used_at": now.isoformat(), "superseded_at": now.isoformat()}},
    )

    await db.password_reset_tokens.insert_one(
        {
            "admin_id": admin_id,
            "email": email,
            "token": token,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=1)).isoformat(),
            "used_at": None,
        }
    )

    return token


async def send_password_reset_email(email: str, token: str) -> dict:
    link = build_password_reset_link(token)
    html = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Reset your SalonFlow AI password</h2>
      <p>We received a request to reset your SalonFlow AI password.</p>
      <p>
        <a href="{link}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link:</p>
      <p>{link}</p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    </div>
    """
    return await send_email(email, "Reset your SalonFlow AI password", html)




def build_auth_response(user: dict) -> dict:
    token = create_access_token(str(user["_id"]))

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
        },
    }


async def find_or_create_google_user(db, google_payload: dict) -> dict:
    now = datetime.now(UTC).isoformat()
    email = str(google_payload.get("email", "")).lower().strip()
    google_sub = str(google_payload.get("sub", "")).strip()
    full_name = str(google_payload.get("name") or email.split("@")[0]).strip()
    provider_avatar_url = str(google_payload.get("picture") or "").strip()
    if provider_avatar_url and not provider_avatar_url.startswith("https://"):
        provider_avatar_url = ""

    if not email or not google_sub:
        raise HTTPException(status_code=400, detail="Invalid Google identity")

    user = await db.admin_users.find_one({"email": email})

    if user is not None:
        google_updates = {
            "google_id": google_sub,
            "auth_provider": user.get("auth_provider", "google"),
            "email_verified": True,
            "email_verified_at": user.get("email_verified_at") or now,
            "last_login_at": now,
            "updated_at": now,
        }
        if provider_avatar_url:
            google_updates["provider_avatar_url"] = provider_avatar_url

        await db.admin_users.update_one(
            {"_id": user["_id"]},
            {"$set": google_updates},
        )
        updated = await db.admin_users.find_one({"_id": user["_id"]})
        return updated or user

    doc = {
        "email": email,
        "full_name": full_name,
        "role": "owner",
        "auth_provider": "google",
        "google_id": google_sub,
        "provider_avatar_url": provider_avatar_url or None,
        "email_verified": True,
        "email_verified_at": now,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }

    result = await db.admin_users.insert_one(doc)
    created = await db.admin_users.find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(status_code=500, detail="Failed to create Google user")

    return created


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

    return serialize_current_user(user)


@router.post("/me/avatar")
async def upload_current_user_avatar(
    file: UploadFile = File(...),
    auth: dict = Depends(require_auth),
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    admin_id = auth.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    content = await file.read(AVATAR_MAX_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Avatar image is empty")
    if len(content) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Avatar image is too large")

    declared_mime = normalize_avatar_mime(file.content_type)
    detected_mime = detect_avatar_mime(content)

    if detected_mime is None or detected_mime not in AVATAR_ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Unsupported avatar image type")
    if declared_mime and declared_mime not in AVATAR_ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Unsupported avatar content type")
    if declared_mime and declared_mime != detected_mime:
        raise HTTPException(status_code=415, detail="Avatar content type mismatch")

    now = datetime.now(UTC).isoformat()
    result = await db.admin_users.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$set": {
                "avatar_blob": Binary(content),
                "avatar_mime": detected_mime,
                "avatar_updated_at": now,
                "updated_at": now,
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_current_user(user)


@router.delete("/me/avatar")
async def delete_current_user_avatar(auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    admin_id = auth.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.admin_users.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$unset": {
                "avatar_blob": "",
                "avatar_mime": "",
                "avatar_updated_at": "",
            },
            "$set": {
                "updated_at": datetime.now(UTC).isoformat(),
            },
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_current_user(user)


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

    if not bool(user.get("email_verified", False)):
        raise HTTPException(status_code=403, detail="EMAIL_NOT_VERIFIED")

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





@router.post("/apple")
async def apple_login(payload: AppleLoginRequest):
    if not payload.identity_token.strip():
        raise HTTPException(status_code=400, detail="Apple identity token is required")

    # Apple token verification needs Apple Developer configuration:
    # Team ID, Service ID / Bundle ID, Key ID, and private key.
    # This endpoint is intentionally guarded until production Apple config is available.
    raise HTTPException(status_code=501, detail="Apple Sign-In is not configured yet")


@router.post("/google")
async def google_login(payload: GoogleLoginRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    client_ids = settings.google_oauth_client_ids
    if not client_ids:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    try:
        google_payload = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            audience=None,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    if google_payload.get("aud") not in client_ids:
        raise HTTPException(status_code=401, detail="Invalid Google audience")

    if not bool(google_payload.get("email_verified", False)):
        raise HTTPException(status_code=403, detail="GOOGLE_EMAIL_NOT_VERIFIED")

    user = await find_or_create_google_user(db, google_payload)
    return build_auth_response(user)


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


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    email = payload.email.lower().strip()
    user = await db.admin_users.find_one({"email": email})

    if user is None:
        return {"ok": True, "message": "If the account exists, a password reset email has been sent"}

    token = await create_password_reset_token(db, str(user["_id"]), email)
    result = await send_password_reset_email(email, token)

    return {
        "ok": True,
        "message": "Password reset email sent",
        "email_result": result,
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    now = datetime.now(UTC)
    token = payload.token.strip()
    new_password = payload.new_password.strip()

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    token_doc = await db.password_reset_tokens.find_one(
        {
            "token": token,
            "used_at": None,
        }
    )

    if token_doc is None:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    expires_at_raw = token_doc.get("expires_at")
    try:
        expires_at = datetime.fromisoformat(expires_at_raw).astimezone(UTC)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    if expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    admin_id = token_doc.get("admin_id")
    if not admin_id or not ObjectId.is_valid(admin_id):
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    user = await db.admin_users.find_one({"_id": ObjectId(admin_id)})
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")

    await db.admin_users.update_one(
        {"_id": ObjectId(admin_id)},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": now.isoformat(),
                "password_changed_at": now.isoformat(),
            }
        },
    )

    await db.password_reset_tokens.update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used_at": now.isoformat()}},
    )

    return {"ok": True, "message": "Password reset successfully"}


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

