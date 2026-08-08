from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import Any
import unittest

from bson import ObjectId

from app.capacity.repository import (
    CapacityReadLimitExceeded,
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


class ResolutionCursor:
    def __init__(self, documents):
        self.documents = list(documents)
        self.length = None

    def sort(self, key, direction):
        return self

    async def to_list(self, *, length):
        self.length = length
        return self.documents[:length]


class ResolutionCollection:
    def __init__(self, documents):
        self.documents = list(documents)
        self.query = None
        self.cursor = None

    def find(self, query):
        self.query = query
        self.cursor = ResolutionCursor(self.documents)
        return self.cursor


class ResolutionDatabase:
    def __init__(self, count=0):
        documents = [{"_id": str(index)} for index in range(count)]
        self.staff_members = ResolutionCollection(documents)
        self.staff_schedule_profiles = ResolutionCollection(documents)
        self.capacity_exceptions = ResolutionCollection(documents)


class CapacityResolutionRepositoryTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_resolution_staff_max_plus_one(self):
        database = ResolutionDatabase()
        repository = CapacityRepository(database)
        await repository.list_resolution_staff("tenant-a")
        self.assertEqual(database.staff_members.cursor.length, 501)
        self.assertEqual(
            database.staff_members.query["owner_id"],
            "tenant-a",
        )

    async def test_resolution_schedules_scoped(self):
        database = ResolutionDatabase()
        repository = CapacityRepository(database)
        await repository.list_resolution_schedules(
            "tenant-a",
            ["staff-a"],
        )
        self.assertEqual(
            database.staff_schedule_profiles.cursor.length,
            501,
        )
        self.assertEqual(
            database.staff_schedule_profiles.query["staff_id"],
            {"$in": ["staff-a"]},
        )

    async def test_resolution_exceptions_scoped(self):
        database = ResolutionDatabase()
        repository = CapacityRepository(database)
        start = datetime(2026, 7, 1, tzinfo=UTC)
        end = datetime(2026, 7, 2, tzinfo=UTC)
        await repository.list_resolution_exceptions(
            "tenant-a",
            start,
            end,
        )
        self.assertEqual(
            database.capacity_exceptions.cursor.length,
            501,
        )
        query = database.capacity_exceptions.query
        self.assertEqual(query["owner_id"], "tenant-a")
        self.assertEqual(query["status"], "active")
        self.assertEqual(query["ends_at_utc"], {"$gt": start})
        self.assertEqual(query["starts_at_utc"], {"$lt": end})

    async def test_resolution_overflow_fails_closed(self):
        database = ResolutionDatabase(count=501)
        repository = CapacityRepository(database)
        with self.assertRaises(CapacityReadLimitExceeded):
            await repository.list_resolution_staff("tenant-a")

    async def test_resolution_schedules_normalizes_object_id_string_ids(self):
        from bson import ObjectId
        from app.capacity.repository import CapacityRepository

        class _Phase62Cursor:
            def sort(self, *args, **kwargs):
                return self

            def limit(self, *args, **kwargs):
                return self

            async def to_list(self, length=None):
                return []

            def __aiter__(self):
                return self

            async def __anext__(self):
                raise StopAsyncIteration

        class _Phase62Collection:
            def __init__(self):
                self.queries = []

            def find(self, query):
                self.queries.append(query)
                return _Phase62Cursor()

        class _Phase62Database:
            def __init__(self):
                self.staff_schedule_profiles = _Phase62Collection()

        database = _Phase62Database()
        repository = CapacityRepository(database)

        staff_id = "64b64b64b64b64b64b64b64b"
        result = await repository.list_resolution_schedules(
            "owner-id-join-regression",
            [staff_id],
        )

        self.assertEqual(result, [])
        self.assertEqual(
            len(database.staff_schedule_profiles.queries),
            1,
        )

        query = database.staff_schedule_profiles.queries[0]
        persisted_ids = query["staff_id"]["$in"]

        self.assertEqual(len(persisted_ids), 2)
        self.assertEqual(persisted_ids[0], staff_id)
        self.assertIsInstance(persisted_ids[1], ObjectId)
        self.assertEqual(str(persisted_ids[1]), staff_id)

        database.staff_schedule_profiles.queries.clear()

        invalid_staff_id = "not-a-valid-object-id"
        invalid_result = await repository.list_resolution_schedules(
            "owner-id-join-regression",
            [invalid_staff_id],
        )

        self.assertEqual(invalid_result, [])
        self.assertEqual(
            len(database.staff_schedule_profiles.queries),
            1,
        )
        invalid_query = database.staff_schedule_profiles.queries[0]
        self.assertEqual(
            invalid_query["staff_id"]["$in"],
            [invalid_staff_id],
        )
