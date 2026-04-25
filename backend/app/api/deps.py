from jose import JWTError, jwt
from fastapi import Header, HTTPException

from app.core.config import settings


async def require_auth(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        subject = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"admin_id": subject}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
