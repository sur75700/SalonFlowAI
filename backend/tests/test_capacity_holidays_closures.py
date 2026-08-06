from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta

from app.capacity.resolver import AuthoritativeCapacityResolver


OWNER = "tenant-a"
START = datetime(2026, 7, 6, tzinfo=UTC)
END = START + timedelta(days=1)


def make_profile() -> dict[str, object]:
    return {
        "owner_id": OWNER,
        "schema_version": 1,
        "status": "active",
        "timezone": "UTC",
        "slot_duration_minutes": 30,
        "weekly_business_hours": [
            {
                "weekday": 0,
                "intervals": [
                    {
                        "start_minute": 540,
                        "end_minute": 1020,
                    }
                ],
            }
        ],
    }


def make_staff() -> dict[str, object]:
    return {
        "_id": "staff-1",
        "owner_id": OWNER,
        "schema_version": 1,
        "is_active": True,
        "capacity_enabled": True,
    }


def make_schedule() -> dict[str, object]:
    return {
        "owner_id": OWNER,
        "staff_id": "staff-1",
        "schema_version": 1,
        "weekly_schedule": [
            {
                "weekday": 0,
                "shifts": [
                    {
                        "start_minute": 540,
                        "end_minute": 1020,
                        "breaks": [],
                    }
                ],
            }
        ],
    }


def make_salon_exception(
    *,
    effect: str = "unavailable",
    status: str = "active",
    start_hour: int = 9,
    end_hour: int = 17,
) -> dict[str, object]:
    return {
        "owner_id": OWNER,
        "schema_version": 1,
        "status": status,
        "scope": "salon",
        "staff_id": None,
        "effect": effect,
        "starts_at_utc": START + timedelta(hours=start_hour),
        "ends_at_utc": START + timedelta(hours=end_hour),
        "timezone_snapshot": "UTC",
    }


def make_staff_available_override() -> dict[str, object]:
    return {
        "owner_id": OWNER,
        "schema_version": 1,
        "status": "active",
        "scope": "staff",
        "staff_id": "staff-1",
        "effect": "available",
        "starts_at_utc": START + timedelta(hours=9),
        "ends_at_utc": START + timedelta(hours=17),
        "timezone_snapshot": "UTC",
    }


class FakeRepository:
    def __init__(
        self,
        exceptions: list[dict[str, object]],
    ) -> None:
        self.exceptions = exceptions

    async def get_profile(self, *, owner_id: str):
        return make_profile()

    async def list_resolution_staff(self, owner_id: str):
        return [make_staff()]

    async def list_resolution_schedules(
        self,
        owner_id: str,
        staff_ids: list[str],
    ):
        return [make_schedule()]

    async def list_resolution_exceptions(
        self,
        owner_id: str,
        start: datetime,
        end: datetime,
    ):
        return self.exceptions


async def resolve(
    exceptions: list[dict[str, object]],
):
    resolver = object.__new__(AuthoritativeCapacityResolver)
    resolver._repository = FakeRepository(exceptions)
    return await resolver.resolve(
        owner_id=OWNER,
        period_start=START,
        period_end=END,
    )


class HolidayClosureTests(unittest.IsolatedAsyncioTestCase):
    async def test_salon_closure_removes_all_capacity(self) -> None:
        result = await resolve(
            [make_salon_exception()]
        )
        self.assertEqual(result.available_minutes, 0)
        self.assertEqual(result.total_slots, 0)
        self.assertEqual(result.blocked_period_count, 1)
        self.assertEqual(result.holiday_closure_count, 1)

    async def test_closure_dominates_available_override(self) -> None:
        result = await resolve(
            [
                make_salon_exception(effect="available"),
                make_salon_exception(effect="unavailable"),
            ]
        )
        self.assertEqual(result.available_minutes, 0)
        self.assertEqual(result.holiday_closure_count, 1)
        self.assertEqual(result.availability_override_count, 1)

    async def test_staff_override_cannot_escape_salon_closure(
        self,
    ) -> None:
        result = await resolve(
            [
                make_salon_exception(effect="unavailable"),
                make_staff_available_override(),
            ]
        )
        self.assertEqual(result.available_minutes, 0)
        self.assertEqual(result.holiday_closure_count, 1)
        self.assertEqual(result.availability_override_count, 1)

    async def test_partial_closure_is_clipped_and_counted(self) -> None:
        result = await resolve(
            [
                make_salon_exception(
                    start_hour=13,
                    end_hour=20,
                )
            ]
        )
        self.assertEqual(result.available_minutes, 240)
        self.assertEqual(result.total_slots, 8)
        self.assertEqual(result.holiday_closure_count, 1)

    async def test_cancelled_closure_is_ignored(self) -> None:
        result = await resolve(
            [
                make_salon_exception(
                    status="cancelled",
                )
            ]
        )
        self.assertEqual(result.available_minutes, 480)
        self.assertEqual(result.blocked_period_count, 0)
        self.assertEqual(result.holiday_closure_count, 0)


if __name__ == "__main__":
    unittest.main()
