from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database

    client = AsyncIOMotorClient(
        settings.mongo_url,
        serverSelectionTimeoutMS=5000,
    )
    await client.admin.command("ping")
    database = client.get_database(settings.mongo_db_name)


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()


def get_database() -> AsyncIOMotorDatabase | None:
    return database
