from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta

from app.capacity.resolver import (
    AuthoritativeCapacityResolver,
    CapacityConfigurationInvalid,
)


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


def make_blocked_period(
    start_hour: int,
    end_hour: int,
    **overrides: object,
) -> dict[str, object]:
    document: dict[str, object] = {
        "owner_id": OWNER,
        "schema_version": 1,
        "status": "active",
        "scope": "staff",
        "staff_id": "staff-1",
        "effect": "unavailable",
        "starts_at_utc": START + timedelta(hours=start_hour),
        "ends_at_utc": START + timedelta(hours=end_hour),
        "timezone_snapshot": "UTC",
    }
    document.update(overrides)
    return document


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


def make_resolver(
    exceptions: list[dict[str, object]],
) -> AuthoritativeCapacityResolver:
    resolver = object.__new__(AuthoritativeCapacityResolver)
    resolver._repository = FakeRepository(exceptions)
    return resolver


async def resolve(
    exceptions: list[dict[str, object]],
):
    return await make_resolver(exceptions).resolve(
        owner_id=OWNER,
        period_start=START,
        period_end=END,
    )


class BlockedPeriodTests(unittest.IsolatedAsyncioTestCase):
    async def test_staff_blocked_period_subtracts_capacity(self) -> None:
        result = await resolve(
            [make_blocked_period(12, 13)]
        )
        self.assertEqual(result.available_minutes, 420)
        self.assertEqual(result.total_slots, 14)
        self.assertEqual(result.blocked_period_count, 1)
        self.assertEqual(result.holiday_closure_count, 0)

    async def test_overlapping_blocks_do_not_double_subtract(self) -> None:
        result = await resolve(
            [
                make_blocked_period(11, 14),
                make_blocked_period(13, 15),
            ]
        )
        self.assertEqual(result.available_minutes, 240)
        self.assertEqual(result.total_slots, 8)
        self.assertEqual(result.blocked_period_count, 2)

    async def test_cancelled_block_is_not_authoritative(self) -> None:
        result = await resolve(
            [
                make_blocked_period(
                    12,
                    13,
                    status="cancelled",
                )
            ]
        )
        self.assertEqual(result.available_minutes, 480)
        self.assertEqual(result.blocked_period_count, 0)

    async def test_invalid_blocked_period_fails_closed(self) -> None:
        with self.assertRaisesRegex(
            CapacityConfigurationInvalid,
            "valid IANA timezone",
        ):
            await resolve(
                [
                    make_blocked_period(
                        12,
                        13,
                        timezone_snapshot="Mars/Olympus",
                    )
                ]
            )


if __name__ == "__main__":
    unittest.main()
