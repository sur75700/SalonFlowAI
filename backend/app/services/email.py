import asyncio
import json
from urllib import request, error

from app.core.config import settings


RESEND_EMAILS_URL = "https://api.resend.com/emails"


async def send_email(to: str, subject: str, html: str) -> dict:
    if not settings.resend_enabled:
        return {
            "ok": True,
            "skipped": True,
            "reason": "resend_disabled",
            "to": to,
            "subject": subject,
        }

    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is required when RESEND_ENABLED=true")

    payload = json.dumps(
        {
            "from": settings.resend_from_email,
            "to": [to],
            "subject": subject,
            "html": html,
        }
    ).encode("utf-8")

    req = request.Request(
        RESEND_EMAILS_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "SalonFlowAI/1.0",
        },
    )

    def _send() -> dict:
        try:
            with request.urlopen(req, timeout=15) as response:
                body = response.read().decode("utf-8")
                return {
                    "ok": 200 <= response.status < 300,
                    "status": response.status,
                    "data": json.loads(body) if body else {},
                }
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            return {
                "ok": False,
                "status": exc.code,
                "error": body,
            }

    return await asyncio.to_thread(_send)
