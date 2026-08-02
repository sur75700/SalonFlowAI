import unittest
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.capacity.resolver import (
    AuthoritativeCapacityResolver,
    CapacityConfigurationInvalid,
    CapacityConfigurationUnavailable,
    ResolvedInterval,
    _local_boundary,
    _normalize,
    _subtract,
)


OWNER = "tenant-a"
START = datetime(2026, 7, 6, tzinfo=UTC)
END = START + timedelta(days=1)
_DEFAULT = object()


def make_profile(**overrides):
    value = {
        "owner_id": OWNER,
        "schema_version": 1,
        "status": "active",
        "timezone": "UTC",
        "slot_duration_minutes": 30,
        "weekly_business_hours": [
            {
                "weekday": 0,
                "intervals": [
                    {"start_minute": 540, "end_minute": 1020}
                ],
            }
        ],
    }
    value.update(overrides)
    return value


def make_staff(identifier="staff-1", **overrides):
    value = {
        "_id": identifier,
        "owner_id": OWNER,
        "schema_version": 1,
        "is_active": True,
        "capacity_enabled": True,
    }
    value.update(overrides)
    return value


def make_schedule(identifier="staff-1", **overrides):
    value = {
        "owner_id": OWNER,
        "staff_id": identifier,
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
    value.update(overrides)
    return value


class FakeRepository:
    def __init__(
        self,
        *,
        profile_document=_DEFAULT,
        staff_documents=_DEFAULT,
        schedules=_DEFAULT,
        exceptions=_DEFAULT,
    ):
        self.profile_document = (
            make_profile()
            if profile_document is _DEFAULT
            else profile_document
        )
        self.staff_documents = (
            [make_staff()]
            if staff_documents is _DEFAULT
            else staff_documents
        )
        self.schedules = (
            [make_schedule()]
            if schedules is _DEFAULT
            else schedules
        )
        self.exceptions = [] if exceptions is _DEFAULT else exceptions

    async def get_profile(self, *, owner_id):
        return self.profile_document

    async def list_resolution_staff(self, owner_id):
        return self.staff_documents

    async def list_resolution_schedules(self, owner_id, staff_ids):
        return self.schedules

    async def list_resolution_exceptions(self, owner_id, start, end):
        return self.exceptions


def make_resolver(repository):
    value = object.__new__(AuthoritativeCapacityResolver)
    value._repository = repository
    return value


async def resolve(repository=None, start=START, end=END):
    return await make_resolver(
        FakeRepository() if repository is None else repository
    ).resolve(
        owner_id=OWNER,
        period_start=start,
        period_end=end,
    )


class CapacityResolverTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_profile_fails_closed(self):
        with self.assertRaises(CapacityConfigurationUnavailable):
            await resolve(FakeRepository(profile_document=None))

    async def test_inactive_profile_fails_closed(self):
        with self.assertRaises(CapacityConfigurationUnavailable):
            await resolve(
                FakeRepository(
                    profile_document=make_profile(status="draft")
                )
            )

    async def test_unsupported_profile_schema(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(
                FakeRepository(
                    profile_document=make_profile(schema_version=2)
                )
            )

    async def test_invalid_timezone(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(
                FakeRepository(
                    profile_document=make_profile(
                        timezone="Mars/Olympus"
                    )
                )
            )

    async def test_naive_window_rejected(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(start=START.replace(tzinfo=None))

    async def test_reversed_window_rejected(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(start=END, end=START)

    async def test_window_limit_enforced(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(end=START + timedelta(days=367))

    async def test_missing_schedule_fails_closed(self):
        with self.assertRaises(CapacityConfigurationUnavailable):
            await resolve(FakeRepository(schedules=[]))

    async def test_unsupported_staff_schema(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(
                FakeRepository(
                    staff_documents=[
                        make_staff(schema_version=2)
                    ]
                )
            )

    async def test_unsupported_schedule_schema(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            await resolve(
                FakeRepository(
                    schedules=[
                        make_schedule(schema_version=2)
                    ]
                )
            )

    async def test_utc_weekday_expansion(self):
        result = await resolve()
        self.assertEqual(result.available_minutes, 480)
        self.assertEqual(result.total_slots, 16)

    async def test_non_utc_conversion(self):
        result = await resolve(
            FakeRepository(
                profile_document=make_profile(
                    timezone="Europe/Paris"
                )
            )
        )
        self.assertEqual(result.available_minutes, 480)

    async def test_window_clipping(self):
        result = await resolve(
            start=START + timedelta(hours=10),
            end=START + timedelta(hours=12),
        )
        self.assertEqual(result.available_minutes, 120)

    async def test_spring_gap_fails_closed(self):
        with self.assertRaises(CapacityConfigurationInvalid):
            _local_boundary(
                datetime(2026, 3, 29).date(),
                150,
                ZoneInfo("Europe/Paris"),
                is_end=False,
            )

    async def test_autumn_fold_counts_both_instants(self):
        timezone = ZoneInfo("Europe/Paris")
        day_value = datetime(2026, 10, 25).date()
        start = _local_boundary(
            day_value,
            150,
            timezone,
            is_end=False,
        )
        end = _local_boundary(
            day_value,
            150,
            timezone,
            is_end=True,
        )
        self.assertEqual(end - start, timedelta(hours=1))

    async def test_break_subtraction(self):
        schedule = make_schedule()
        schedule["weekly_schedule"][0]["shifts"][0]["breaks"] = [
            {"start_minute": 720, "end_minute": 780}
        ]
        result = await resolve(
            FakeRepository(schedules=[schedule])
        )
        self.assertEqual(result.available_minutes, 420)

    async def test_cross_staff_is_additive(self):
        result = await resolve(
            FakeRepository(
                staff_documents=[
                    make_staff("a"),
                    make_staff("b"),
                ],
                schedules=[
                    make_schedule("a"),
                    make_schedule("b"),
                ],
            )
        )
        self.assertEqual(result.available_minutes, 960)
        self.assertEqual(result.active_staff_count, 2)

    async def test_salon_unavailable_dominates(self):
        exception = {
            "status": "active",
            "scope": "salon",
            "effect": "unavailable",
            "starts_at_utc": START + timedelta(hours=9),
            "ends_at_utc": START + timedelta(hours=17),
        }
        result = await resolve(
            FakeRepository(exceptions=[exception])
        )
        self.assertEqual(result.available_minutes, 0)

    async def test_naive_mongo_staff_unavailable_subtracts(self):
        exception = {
            "status": "active",
            "scope": "staff",
            "staff_id": "staff-1",
            "effect": "unavailable",
            "starts_at_utc": (
                START + timedelta(hours=12)
            ).replace(tzinfo=None),
            "ends_at_utc": (
                START + timedelta(hours=13)
            ).replace(tzinfo=None),
        }
        result = await resolve(
            FakeRepository(exceptions=[exception])
        )
        self.assertEqual(result.available_minutes, 420)

    async def test_cancelled_exception_is_ignored(self):
        exception = {
            "status": "cancelled",
            "scope": "salon",
            "effect": "unavailable",
            "starts_at_utc": START + timedelta(hours=9),
            "ends_at_utc": START + timedelta(hours=17),
        }
        result = await resolve(
            FakeRepository(exceptions=[exception])
        )
        self.assertEqual(result.available_minutes, 480)

    async def test_active_staff_requires_capacity(self):
        result = await resolve(
            FakeRepository(
                staff_documents=[
                    make_staff("a"),
                    make_staff("b"),
                ],
                schedules=[
                    make_schedule("a"),
                    make_schedule("b", weekly_schedule=[]),
                ],
            )
        )
        self.assertEqual(result.active_staff_count, 1)

    async def test_result_is_immutable(self):
        result = await resolve()
        with self.assertRaises(AttributeError):
            result.total_slots = 1

    async def test_interval_union(self):
        first = ResolvedInterval(
            START,
            START + timedelta(hours=2),
        )
        second = ResolvedInterval(
            START + timedelta(hours=1),
            START + timedelta(hours=3),
        )
        self.assertEqual(len(_normalize((first, second))), 1)

    async def test_interval_subtraction(self):
        base = ResolvedInterval(
            START,
            START + timedelta(hours=2),
        )
        cut = ResolvedInterval(
            START + timedelta(minutes=30),
            START + timedelta(minutes=90),
        )
        self.assertEqual(len(_subtract((base,), (cut,))), 2)
