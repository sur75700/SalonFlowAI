from __future__ import annotations

from types import SimpleNamespace
import hashlib
import json
from typing import Any
import unittest

from pymongo.errors import CollectionInvalid

from app.db.migrations.phase_62a_capacity import (
    MIGRATION_CHECKSUM,
    MIGRATION_ID,
    MIGRATION_SPEC,
    _ensure_collection,
    apply_capacity_foundation,
)
from app.db.migrations.runner import run_migrations


class FakeCollection:
    def __init__(self) -> None:
        self.indexes: list[dict[str, Any]] = []
        self.records: dict[str, dict[str, Any]] = {}

    async def create_index(
        self,
        keys: list[tuple[str, int]],
        **options: Any,
    ) -> str:
        self.indexes.append(
            {"keys": keys, **options}
        )
        return str(options.get("name") or "index")

    async def find_one(
        self,
        query: dict[str, Any],
    ) -> dict[str, Any] | None:
        identifier = query.get("_id")
        if not isinstance(identifier, str):
            return None
        return self.records.get(identifier)

    async def insert_one(
        self,
        document: dict[str, Any],
    ) -> SimpleNamespace:
        identifier = str(document["_id"])
        self.records[identifier] = dict(document)
        return SimpleNamespace(inserted_id=identifier)


class FakeDatabase:
    def __init__(self) -> None:
        self.names = {"appointments"}
        self.collections: dict[str, FakeCollection] = {
            "appointments": FakeCollection()
        }
        self.commands: list[dict[str, Any]] = []

    async def list_collection_names(self) -> list[str]:
        return sorted(self.names)

    async def create_collection(
        self,
        name: str,
        **_: Any,
    ) -> FakeCollection:
        self.names.add(name)
        collection = self.collections.setdefault(
            name,
            FakeCollection(),
        )
        return collection

    async def command(
        self,
        command: dict[str, Any],
    ) -> dict[str, int]:
        self.commands.append(command)
        return {"ok": 1}

    def __getitem__(self, name: str) -> FakeCollection:
        return self.collections.setdefault(
            name,
            FakeCollection(),
        )

    def __getattr__(self, name: str) -> FakeCollection:
        if name.startswith("__"):
            raise AttributeError(name)
        return self[name]


class ConcurrentCreateDatabase(FakeDatabase):
    def __init__(self) -> None:
        super().__init__()
        self.raise_collection_invalid = True

    async def create_collection(
        self,
        name: str,
        **options: Any,
    ) -> FakeCollection:
        if self.raise_collection_invalid:
            self.raise_collection_invalid = False
            self.names.add(name)
            self.collections.setdefault(
                name,
                FakeCollection(),
            )
            raise CollectionInvalid(name)
        return await super().create_collection(
            name,
            **options,
        )


class CapacityMigrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_foundation_creates_collections_and_indexes(
        self,
    ) -> None:
        database = FakeDatabase()

        await apply_capacity_foundation(database)

        self.assertTrue(
            {
                "salon_capacity_profiles",
                "staff_members",
                "staff_schedule_profiles",
                "capacity_exceptions",
            }.issubset(database.names)
        )
        profile_names = {
            item["name"]
            for item in (
                database.salon_capacity_profiles.indexes
            )
        }
        self.assertIn(
            "uq_capacity_profile_owner",
            profile_names,
        )
        appointment_names = {
            item["name"]
            for item in database.appointments.indexes
        }
        self.assertIn(
            "ix_appointment_owner_status_start",
            appointment_names,
        )

    async def test_runner_is_idempotent(self) -> None:
        database = FakeDatabase()

        await run_migrations(database)
        first_index_count = len(
            database.salon_capacity_profiles.indexes
        )
        await run_migrations(database)

        ledger = database["_schema_migrations"]
        self.assertEqual(len(ledger.records), 1)
        self.assertIn(MIGRATION_ID, ledger.records)
        self.assertEqual(
            ledger.records[MIGRATION_ID]["checksum"],
            MIGRATION_CHECKSUM,
        )
        self.assertEqual(
            len(database.salon_capacity_profiles.indexes),
            first_index_count,
        )

    async def test_runner_rejects_checksum_drift(self) -> None:
        database = FakeDatabase()
        await database.create_collection(
            "_schema_migrations"
        )
        database["_schema_migrations"].records[
            MIGRATION_ID
        ] = {
            "_id": MIGRATION_ID,
            "checksum": "wrong",
        }

        with self.assertRaisesRegex(
            RuntimeError,
            "checksum mismatch",
        ):
            await run_migrations(database)

    def test_checksum_covers_full_migration_spec(self) -> None:
        expected = hashlib.sha256(
            json.dumps(
                MIGRATION_SPEC,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest()

        self.assertEqual(MIGRATION_CHECKSUM, expected)
        self.assertIsInstance(
            MIGRATION_SPEC["collections"],
            dict,
        )
        self.assertGreater(
            len(MIGRATION_SPEC["indexes"]),
            0,
        )
        profile_schema = MIGRATION_SPEC["collections"][
            "salon_capacity_profiles"
        ]["$jsonSchema"]
        self.assertFalse(
            profile_schema["additionalProperties"]
        )
        self.assertIn("_id", profile_schema["properties"])

    async def test_concurrent_collection_creation_recovers(
        self,
    ) -> None:
        database = ConcurrentCreateDatabase()

        await _ensure_collection(
            database,
            name="salon_capacity_profiles",
            validator=MIGRATION_SPEC["collections"][
                "salon_capacity_profiles"
            ],
        )

        self.assertIn(
            "salon_capacity_profiles",
            database.names,
        )
        self.assertEqual(
            database.commands[0]["collMod"],
            "salon_capacity_profiles",
        )


if __name__ == "__main__":
    unittest.main()
