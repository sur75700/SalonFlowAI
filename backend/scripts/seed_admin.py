import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import hash_password
import os


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise RuntimeError(
            f"{name} must be set and non-empty"
        )
    return value



async def main():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client.get_database(settings.mongo_db_name)

    email = "admin@salonflowai.com"
    password = _require_env("SALONFLOWAI_SEED_ADMIN_PASSWORD")
    full_name = "SalonFlow Admin"

    existing = await db.admin_users.find_one({"email": email.lower()})
    if existing:
        print("Admin already exists.")
        client.close()
        return

    await db.admin_users.insert_one(
        {
            "email": email.lower(),
            "full_name": full_name,
            "password_hash": hash_password(password),
            "role": "admin",
        }
    )

    print("Admin created:")
    print(f"email: {email}")
    print(f"password: {password}")

    client.close()


asyncio.run(main())
