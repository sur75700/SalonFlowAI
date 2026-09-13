from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pymongo.errors import CollectionInvalid, DuplicateKeyError

from app.db.migrations.phase_62a_capacity import (
    MIGRATION_CHECKSUM,
    MIGRATION_ID,
    apply_capacity_foundation,
)
from app.db.migrations.phase_63e_revenue_time_series import (
    MIGRATION_CHECKSUM as REVENUE_TIME_SERIES_MIGRATION_CHECKSUM,
    MIGRATION_ID as REVENUE_TIME_SERIES_MIGRATION_ID,
    apply_revenue_time_series_index,
)

_LEDGER_COLLECTION = "_schema_migrations"


async def _ensure_ledger(database: Any) -> None:
    existing = set(await database.list_collection_names())
    if _LEDGER_COLLECTION not in existing:
        try:
            await database.create_collection(_LEDGER_COLLECTION)
        except CollectionInvalid:
            existing = set(await database.list_collection_names())
            if _LEDGER_COLLECTION not in existing:
                raise
    await database[_LEDGER_COLLECTION].create_index(
        [("applied_at", 1)],
        name="ix_schema_migrations_applied_at",
    )


async def _apply_phase_62a(database: Any) -> None:
    ledger = database[_LEDGER_COLLECTION]
    existing = await ledger.find_one({"_id": MIGRATION_ID})
    if existing is not None:
        if existing.get("checksum") != MIGRATION_CHECKSUM:
            raise RuntimeError(
                "migration checksum mismatch for "
                f"{MIGRATION_ID}"
            )
        return

    await apply_capacity_foundation(database)
    record = {
        "_id": MIGRATION_ID,
        "checksum": MIGRATION_CHECKSUM,
        "applied_at": datetime.now(UTC),
        "application": "SalonFlowAI",
    }
    try:
        await ledger.insert_one(record)
    except DuplicateKeyError:
        existing = await ledger.find_one({"_id": MIGRATION_ID})
        if (
            existing is None
            or existing.get("checksum") != MIGRATION_CHECKSUM
        ):
            raise



async def _apply_phase_63e_revenue_time_series(
    database: Any,
) -> None:
    ledger = database["_schema_migrations"]

    existing = await ledger.find_one(
        {
            "_id": REVENUE_TIME_SERIES_MIGRATION_ID,
        }
    )

    if existing is not None:
        if (
            existing.get("checksum")
            != REVENUE_TIME_SERIES_MIGRATION_CHECKSUM
        ):
            raise RuntimeError(
                "Migration checksum mismatch for "
                f"{REVENUE_TIME_SERIES_MIGRATION_ID}"
            )

        return

    await apply_revenue_time_series_index(
        database
    )

    try:
        await ledger.insert_one(
            {
                "_id": REVENUE_TIME_SERIES_MIGRATION_ID,
                "checksum": REVENUE_TIME_SERIES_MIGRATION_CHECKSUM,
                "applied_at": datetime.now(UTC).isoformat(),
            }
        )
    except DuplicateKeyError:
        pass

    recorded = await ledger.find_one(
        {
            "_id": REVENUE_TIME_SERIES_MIGRATION_ID,
        }
    )

    if (
        recorded is None
        or recorded.get("checksum")
        != REVENUE_TIME_SERIES_MIGRATION_CHECKSUM
    ):
        raise RuntimeError(
            "Migration ledger verification failed for "
            f"{REVENUE_TIME_SERIES_MIGRATION_ID}"
        )

async def run_migrations(database: Any) -> None:
    if database is None:
        raise TypeError("database is required")
    await _ensure_ledger(database)
    await _apply_phase_62a(database)
    await _apply_phase_63e_revenue_time_series(database)
