from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import Any
import unittest

from bson import ObjectId

from app.capacity.repository import (
    CapacityRepository,
    CapacityRevisionConflict,
)
from app.capacity.service import CapacityService


class FakeCursor:
    def __init__(self, items: list[dict[str, Any]]) -> None:
        self.items = items
        self.length: int | None = None
        self.sort_args: tuple[Any, ...] | None = None

    def sort(self, *args: Any) -> "FakeCursor":
        self.sort_args = args
        return self

    async def to_list(self, *, length: int) -> list[dict[str, Any]]:
        self.length = length
        return list(self.items[:length])


class FakeCollection:
    def __init__(self) -> None:
        self.find_one_results: list[dict[str, Any] | None] = []
        self.find_items: list[dict[str, Any]] = []
        self.find_queries: list[dict[str, Any]] = []
        self.find_one_queries: list[dict[str, Any]] = []
        self.update_queries: list[dict[str, Any]] = []
        self.update_documents: list[dict[str, Any]] = []
        self.inserted_documents: list[dict[str, Any]] = []
        self.find_one_and_update_result: dict[str, Any] | None = None
        self.last_cursor: FakeCursor | None = None

    async def find_one(
        self,
        query: dict[str, Any],
    ) -> dict[str, Any] | None:
        self.find_one_queries.append(query)
        if self.find_one_results:
            return self.find_one_results.pop(0)
        return None

    def find(self, query: dict[str, Any]) -> FakeCursor:
        self.find_queries.append(query)
        self.last_cursor = FakeCursor(self.find_items)
        return self.last_cursor

    async def insert_one(
        self,
        document: dict[str, Any],
    ) -> SimpleNamespace:
        self.inserted_documents.append(document)
        return SimpleNamespace(inserted_id=ObjectId())

    async def find_one_and_update(
        self,
        query: dict[str, Any],
        update: dict[str, Any],
        **_: Any,
    ) -> dict[str, Any] | None:
        self.update_queries.append(query)
        self.update_documents.append(update)
        return self.find_one_and_update_result


class FakeDatabase:
    def __init__(self) -> None:
        self.salon_capacity_profiles = FakeCollection()
        self.staff_members = FakeCollection()
        self.staff_schedule_profiles = FakeCollection()
        self.capacity_exceptions = FakeCollection()


class CapacityRepositoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_profile_create_is_tenant_owned(self) -> None:
        database = FakeDatabase()
        database.salon_capacity_profiles.find_one_results = [None]
        repository = CapacityRepository(database)

        result = await repository.save_profile(
            owner_id="owner-a",
            values={
                "status": "draft",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
                "weekly_business_hours": [],
            },
            expected_revision=None,
        )

        document = (
            database.salon_capacity_profiles.inserted_documents[0]
        )
        self.assertEqual(document["owner_id"], "owner-a")
        self.assertEqual(document["revision"], 1)
        self.assertEqual(document["schema_version"], 1)
        self.assertEqual(result["owner_id"], "owner-a")
        self.assertIsInstance(document["created_at"], datetime)

    async def test_profile_update_requires_revision(self) -> None:
        database = FakeDatabase()
        database.salon_capacity_profiles.find_one_results = [
            {"owner_id": "owner-a", "revision": 2}
        ]
        repository = CapacityRepository(database)

        with self.assertRaisesRegex(
            CapacityRevisionConflict,
            "revision is required",
        ):
            await repository.save_profile(
                owner_id="owner-a",
                values={"status": "draft"},
                expected_revision=None,
            )

    async def test_staff_list_is_bounded_and_scoped(self) -> None:
        database = FakeDatabase()
        database.staff_members.find_items = [
            {"owner_id": "owner-a", "display_name": "Anna"}
        ]
        repository = CapacityRepository(database)

        items = await repository.list_staff(owner_id="owner-a")

        self.assertEqual(len(items), 1)
        self.assertEqual(
            database.staff_members.find_queries,
            [{"owner_id": "owner-a"}],
        )
        cursor = database.staff_members.last_cursor
        self.assertIsNotNone(cursor)
        self.assertEqual(cursor.length, 500)

    async def test_staff_update_filter_has_owner_and_revision(
        self,
    ) -> None:
        database = FakeDatabase()
        staff_id = ObjectId()
        database.staff_members.find_one_and_update_result = {
            "_id": staff_id,
            "owner_id": "owner-a",
            "revision": 3,
        }
        repository = CapacityRepository(database)

        await repository.update_staff(
            owner_id="owner-a",
            staff_id=staff_id,
            values={"display_name": "Anna"},
            expected_revision=2,
        )

        self.assertEqual(
            database.staff_members.update_queries[0],
            {
                "_id": staff_id,
                "owner_id": "owner-a",
                "revision": 2,
            },
        )

    async def test_exception_query_uses_overlap_window(self) -> None:
        database = FakeDatabase()
        repository = CapacityRepository(database)
        start = datetime(2026, 8, 1, tzinfo=UTC)
        end = datetime(2026, 8, 2, tzinfo=UTC)

        await repository.list_exceptions(
            owner_id="owner-a",
            starts_at_utc=start,
            ends_at_utc=end,
            staff_id=None,
            status="active",
        )

        self.assertEqual(
            database.capacity_exceptions.find_queries[0],
            {
                "owner_id": "owner-a",
                "ends_at_utc": {"$gt": start},
                "starts_at_utc": {"$lt": end},
                "status": "active",
            },
        )
        cursor = database.capacity_exceptions.last_cursor
        self.assertIsNotNone(cursor)
        self.assertEqual(cursor.length, 500)


class CapacityServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_readiness_fails_closed_without_profile(self) -> None:
        database = FakeDatabase()
        database.salon_capacity_profiles.find_one_results = [None]
        service = CapacityService(CapacityRepository(database))

        result = await service.get_readiness(owner_id="owner-a")

        self.assertFalse(result["ready"])
        self.assertEqual(result["status"], "not_configured")
        self.assertIn("salon_timezone", result["missing"])
        self.assertIn("active_staff_schedule", result["missing"])

    async def test_readiness_requires_every_staff_schedule(self) -> None:
        database = FakeDatabase()
        staff_id = ObjectId()
        database.salon_capacity_profiles.find_one_results = [
            {
                "schema_version": 1,
                "revision": 1,
                "status": "active",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
                "weekly_business_hours": [
                    {
                        "weekday": 0,
                        "intervals": [
                            {
                                "start_minute": 540,
                                "end_minute": 1080,
                            }
                        ],
                    }
                ],
            }
        ]
        database.staff_members.find_items = [
            {
                "_id": staff_id,
                "owner_id": "owner-a",
                "schema_version": 1,
                "is_active": True,
                "capacity_enabled": True,
            }
        ]
        service = CapacityService(CapacityRepository(database))

        result = await service.get_readiness(owner_id="owner-a")

        self.assertFalse(result["ready"])
        self.assertIn("active_staff_schedule", result["missing"])

    async def test_readiness_rejects_unsupported_schema_version(
        self,
    ) -> None:
        database = FakeDatabase()
        database.salon_capacity_profiles.find_one_results = [
            {
                "schema_version": 2,
                "revision": 1,
                "status": "active",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
                "weekly_business_hours": [
                    {
                        "weekday": 0,
                        "intervals": [
                            {
                                "start_minute": 540,
                                "end_minute": 1080,
                            }
                        ],
                    }
                ],
            }
        ]
        database.staff_members.find_items = []
        service = CapacityService(CapacityRepository(database))

        result = await service.get_readiness(owner_id="owner-a")

        self.assertFalse(result["ready"])
        self.assertIn(
            "unsupported_schema_version",
            result["missing"],
        )

    async def test_readiness_rejects_invalid_persisted_schedule(
        self,
    ) -> None:
        database = FakeDatabase()
        staff_id = ObjectId()
        database.salon_capacity_profiles.find_one_results = [
            {
                "schema_version": 1,
                "revision": 1,
                "status": "active",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
                "weekly_business_hours": [
                    {
                        "weekday": 0,
                        "intervals": [
                            {
                                "start_minute": 540,
                                "end_minute": 1080,
                            }
                        ],
                    }
                ],
            }
        ]
        database.staff_members.find_items = [
            {
                "_id": staff_id,
                "owner_id": "owner-a",
                "schema_version": 1,
                "is_active": True,
                "capacity_enabled": True,
            }
        ]
        database.staff_schedule_profiles.find_items = [
            {
                "staff_id": staff_id,
                "schema_version": 1,
                "weekly_schedule": [
                    {
                        "weekday": 0,
                        "shifts": [
                            {
                                "start_minute": 600,
                                "end_minute": 900,
                                "breaks": [
                                    {
                                        "start_minute": 500,
                                        "end_minute": 550,
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ]
        service = CapacityService(CapacityRepository(database))

        result = await service.get_readiness(owner_id="owner-a")

        self.assertFalse(result["ready"])
        self.assertIn(
            "active_staff_schedule",
            result["missing"],
        )

    async def test_readiness_requires_business_hour_overlap(
        self,
    ) -> None:
        database = FakeDatabase()
        staff_id = ObjectId()
        database.salon_capacity_profiles.find_one_results = [
            {
                "schema_version": 1,
                "revision": 1,
                "status": "active",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
                "weekly_business_hours": [
                    {
                        "weekday": 0,
                        "intervals": [
                            {
                                "start_minute": 540,
                                "end_minute": 600,
                            }
                        ],
                    }
                ],
            }
        ]
        database.staff_members.find_items = [
            {
                "_id": staff_id,
                "owner_id": "owner-a",
                "schema_version": 1,
                "is_active": True,
                "capacity_enabled": True,
            }
        ]
        database.staff_schedule_profiles.find_items = [
            {
                "staff_id": staff_id,
                "schema_version": 1,
                "weekly_schedule": [
                    {
                        "weekday": 0,
                        "shifts": [
                            {
                                "start_minute": 600,
                                "end_minute": 660,
                                "breaks": [],
                            }
                        ],
                    }
                ],
            }
        ]
        service = CapacityService(CapacityRepository(database))

        result = await service.get_readiness(owner_id="owner-a")

        self.assertFalse(result["ready"])
        self.assertIn(
            "active_staff_schedule",
            result["missing"],
        )


if __name__ == "__main__":
    unittest.main()
