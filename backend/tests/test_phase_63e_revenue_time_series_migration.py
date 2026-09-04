from __future__ import annotations

import hashlib
import json
import unittest
from typing import Any

from app.db.migrations.phase_63e_revenue_time_series import (
    MIGRATION_CHECKSUM,
    MIGRATION_ID,
    MIGRATION_SPEC,
    apply_revenue_time_series_index,
)


EXPECTED_INDEX_NAME = (
    "ix_appointment_owner_status_currency_start"
)

EXPECTED_KEYS = [
    ("owner_id", 1),
    ("status", 1),
    ("currency_snapshot", 1),
    ("starts_at", 1),
]


class FakeCollection:
    def __init__(self) -> None:
        self.indexes: dict[
            str,
            dict[str, Any],
        ] = {}

    async def create_index(
        self,
        keys: list[tuple[str, int]],
        **options: Any,
    ) -> str:
        name = str(
            options.get("name")
            or "index"
        )

        self.indexes[name] = {
            "keys": list(keys),
            **options,
        }

        return name


class FakeDatabase:
    def __init__(self) -> None:
        self.collections = {
            "appointments": FakeCollection(),
        }

    def __getitem__(
        self,
        name: str,
    ) -> FakeCollection:
        return self.collections.setdefault(
            name,
            FakeCollection(),
        )


class RevenueTimeSeriesMigrationTests(
    unittest.IsolatedAsyncioTestCase
):
    def test_migration_identity_is_frozen(
        self,
    ) -> None:
        self.assertEqual(
            MIGRATION_ID,
            "phase_63e_revenue_time_series_index_v1",
        )

    def test_checksum_covers_full_spec(
        self,
    ) -> None:
        expected = hashlib.sha256(
            json.dumps(
                MIGRATION_SPEC,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest()

        self.assertEqual(
            MIGRATION_CHECKSUM,
            expected,
        )

    def test_index_contract_is_exact_and_additive(
        self,
    ) -> None:
        indexes = MIGRATION_SPEC[
            "indexes"
        ]

        self.assertEqual(
            len(indexes),
            1,
        )

        definition = indexes[0]

        self.assertEqual(
            definition["collection"],
            "appointments",
        )

        self.assertEqual(
            list(definition["keys"]),
            EXPECTED_KEYS,
        )

        self.assertEqual(
            definition["options"]["name"],
            EXPECTED_INDEX_NAME,
        )

        rendered = repr(
            MIGRATION_SPEC
        ).lower()

        self.assertNotIn(
            "drop",
            rendered,
        )

        self.assertNotIn(
            "delete",
            rendered,
        )

        self.assertNotIn(
            "rename",
            rendered,
        )

    async def test_apply_creates_exact_index(
        self,
    ) -> None:
        database = FakeDatabase()

        await apply_revenue_time_series_index(
            database
        )

        index = (
            database
            .collections["appointments"]
            .indexes[EXPECTED_INDEX_NAME]
        )

        self.assertEqual(
            index["keys"],
            EXPECTED_KEYS,
        )

    async def test_apply_is_idempotent_by_deterministic_name(
        self,
    ) -> None:
        database = FakeDatabase()

        await apply_revenue_time_series_index(
            database
        )

        await apply_revenue_time_series_index(
            database
        )

        indexes = (
            database
            .collections["appointments"]
            .indexes
        )

        self.assertEqual(
            list(indexes),
            [
                EXPECTED_INDEX_NAME
            ],
        )


if __name__ == "__main__":
    unittest.main()
