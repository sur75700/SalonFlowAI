from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)

from app.core.config import settings
from app.db.migrations import run_migrations

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database

    new_client = AsyncIOMotorClient(
        settings.mongo_url,
        serverSelectionTimeoutMS=5000,
    )
    new_database = new_client.get_database(
        settings.mongo_db_name
    )
    try:
        await new_client.admin.command("ping")
        await run_migrations(new_database)
    except Exception:
        new_client.close()
        raise

    client = new_client
    database = new_database


async def close_mongo_connection() -> None:
    global client, database

    if client is not None:
        client.close()
    client = None
    database = None


def get_database() -> AsyncIOMotorDatabase | None:
    return database
