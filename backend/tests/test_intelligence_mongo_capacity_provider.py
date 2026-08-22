import unittest
from datetime import UTC, date, datetime
from unittest.mock import patch

from app.intelligence.capacity import (
    CAPACITY_BASELINE_METADATA_KEY,
    CapacityBaseline,
    CapacityDataUnavailable,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.models import AnalysisWindow
from app.intelligence.providers.mongo_capacity_provider import (
    MongoCapacityProvider,
    _appointment_duration_minutes,
)


class FakeCursor:
    def __init__(self, documents):
        self.documents = list(documents)
        self.sort_args = None
        self.limit = None

    def sort(self, key, direction):
        self.sort_args = (key, direction)
        return self

    async def to_list(self, *, length):
        self.limit = length
        return list(
            self.documents[:length]
        )


class FakeCollection:
    def __init__(self, documents):
        self.documents = list(documents)
        self.query = None
        self.find_calls = 0
        self.cursor = None

    def find(self, query):
        self.query = query
        self.find_calls += 1
        self.cursor = FakeCursor(
            self.documents
        )
        return self.cursor


class FakeDatabase:
    def __init__(self, documents):
        self.appointments = FakeCollection(
            documents
        )


class MongoCapacityProviderTests(
    unittest.IsolatedAsyncioTestCase
):
    def build_context(
        self,
        *,
        total_slots=10,
        active_staff_count=2,
        available_minutes=960,
        baseline_period_start=None,
        baseline_period_end=None,
    ):
        default_period_start = datetime(
            2026,
            7,
            1,
            tzinfo=UTC,
        )
        default_period_end = datetime(
            2026,
            7,
            8,
            tzinfo=UTC,
        )

        baseline = CapacityBaseline(
            owner_id="tenant-a",
            period_start=(
                baseline_period_start
                or default_period_start
            ),
            period_end=(
                baseline_period_end
                or default_period_end
            ),
            total_slots=total_slots,
            active_staff_count=(
                active_staff_count
            ),
            available_minutes=(
                available_minutes
            ),
            source="staff_schedule",
        )

        return IntelligenceContext(
            owner_id="tenant-a",
            generated_at=datetime(
                2026,
                7,
                8,
                12,
                tzinfo=UTC,
            ),
            window=AnalysisWindow(
                start=date(2026, 7, 1),
                end=date(2026, 7, 7),
                label="7d",
            ),
            metadata={
                CAPACITY_BASELINE_METADATA_KEY: (
                    baseline
                )
            },
        )

    async def test_builds_period_aware_snapshot(
        self,
    ):
        documents = [
            {
                "owner_id": "tenant-a",
                "status": "scheduled",
                "starts_at": (
                    "2026-07-01T09:00:00+00:00"
                ),
                "ends_at": (
                    "2026-07-01T10:00:00+00:00"
                ),
                "duration_minutes_snapshot": 60,
            },
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-07T11:00:00+00:00"
                ),
                "ends_at": (
                    "2026-07-07T12:30:00+00:00"
                ),
                "duration_minutes_snapshot": 90,
            },
            {
                "owner_id": "tenant-a",
                "status": "cancelled",
                "starts_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
                "ends_at": (
                    "2026-07-03T11:00:00+00:00"
                ),
            },
            {
                "owner_id": "tenant-b",
                "status": "completed",
                "starts_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
                "ends_at": (
                    "2026-07-03T11:00:00+00:00"
                ),
            },
            {
                "owner_id": "tenant-a",
                "status": "scheduled",
                "starts_at": (
                    "2026-06-30T09:00:00+00:00"
                ),
                "ends_at": (
                    "2026-06-30T10:00:00+00:00"
                ),
            },
            {
                "owner_id": "tenant-a",
                "status": "scheduled",
                "starts_at": "invalid-date",
                "ends_at": (
                    "2026-07-04T10:00:00+00:00"
                ),
            },
        ]

        database = FakeDatabase(documents)

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoCapacityProvider()
                .get_capacity_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.owner_id,
            "tenant-a",
        )
        self.assertEqual(
            snapshot.period_start,
            datetime(2026, 7, 1, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.period_end,
            datetime(2026, 7, 8, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.total_slots,
            10,
        )
        self.assertEqual(
            snapshot.booked_slots,
            2,
        )
        self.assertEqual(
            snapshot.completed_booking_count,
            1,
        )
        self.assertEqual(
            snapshot.active_staff_count,
            2,
        )
        self.assertEqual(
            snapshot.available_minutes,
            960,
        )
        self.assertEqual(
            snapshot.booked_minutes,
            150,
        )

        self.assertEqual(
            database.appointments.query,
            {
                "owner_id": "tenant-a",
                "status": {
                    "$in": [
                        "completed",
                        "scheduled",
                    ]
                },
                "starts_at": {
                    "$gte": (
                        "2026-07-01T00:00:00+00:00"
                    ),
                    "$lt": (
                        "2026-07-08T00:00:00+00:00"
                    ),
                },
            },
        )

        self.assertEqual(
            database.appointments.find_calls,
            1,
        )
        self.assertEqual(
            database.appointments.cursor.sort_args,
            ("starts_at", 1),
        )

    async def test_uses_duration_snapshot_fallback(
        self,
    ):
        database = FakeDatabase(
            [
                {
                    "owner_id": "tenant-a",
                    "status": "scheduled",
                    "starts_at": (
                        "2026-07-03T09:00:00+00:00"
                    ),
                    "ends_at": "invalid",
                    "duration_minutes_snapshot": "45",
                }
            ]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoCapacityProvider()
                .get_capacity_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.booked_slots,
            1,
        )
        self.assertEqual(
            snapshot.booked_minutes,
            45,
        )

    async def test_appointment_limit_accepts_exact_limit(
        self,
    ):
        database = FakeDatabase(
            [{} for _ in range(5_000)]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoCapacityProvider()
                .get_capacity_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(snapshot.booked_slots, 0)
        self.assertEqual(
            database.appointments.cursor.limit,
            5_001,
        )

    async def test_appointment_limit_fails_closed(
        self,
    ):
        database = FakeDatabase(
            [{} for _ in range(5_001)]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                CapacityDataUnavailable,
                "capacity appointment history exceeds "
                "supported intelligence limit",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=self.build_context()
                    )
                )

        self.assertEqual(
            database.appointments.cursor.limit,
            5_001,
        )

    async def test_missing_baseline_fails_closed(
        self,
    ):
        context = IntelligenceContext(
            owner_id="tenant-a"
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database"
        ) as database_mock:
            with self.assertRaisesRegex(
                CapacityDataUnavailable,
                "trusted capacity baseline",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=context
                    )
                )

        database_mock.assert_not_called()

    async def test_mismatched_baseline_period_fails_closed(
        self,
    ):
        context = self.build_context(
            baseline_period_start=datetime(
                2026,
                6,
                1,
                tzinfo=UTC,
            ),
            baseline_period_end=datetime(
                2026,
                6,
                8,
                tzinfo=UTC,
            ),
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database"
        ) as database_mock:
            with self.assertRaisesRegex(
                CapacityDataUnavailable,
                "period does not match analysis window",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=context
                    )
                )

        database_mock.assert_not_called()

    async def test_missing_database_fails_closed(
        self,
    ):
        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=None,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "Database not connected",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_zero_slot_baseline_with_booking_is_rejected(
        self,
    ):
        database = FakeDatabase(
            [
                {
                    "owner_id": "tenant-a",
                    "status": "scheduled",
                    "starts_at": (
                        "2026-07-03T09:00:00+00:00"
                    ),
                    "ends_at": (
                        "2026-07-03T10:00:00+00:00"
                    ),
                }
            ]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                CapacityDataUnavailable,
                "zero total slots",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=self.build_context(
                            total_slots=0,
                        )
                    )
                )

    async def test_zero_minutes_baseline_with_booked_time_is_rejected(
        self,
    ):
        database = FakeDatabase(
            [
                {
                    "owner_id": "tenant-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-03T09:00:00+00:00"
                    ),
                    "ends_at": (
                        "2026-07-03T10:00:00+00:00"
                    ),
                }
            ]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                CapacityDataUnavailable,
                "zero available minutes",
            ):
                await (
                    MongoCapacityProvider()
                    .get_capacity_snapshot(
                        context=self.build_context(
                            available_minutes=0,
                        )
                    )
                )

    async def test_zero_capacity_without_bookings_is_valid(
        self,
    ):
        database = FakeDatabase([])

        with patch(
            "app.intelligence.providers."
            "mongo_capacity_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoCapacityProvider()
                .get_capacity_snapshot(
                    context=self.build_context(
                        total_slots=0,
                        active_staff_count=0,
                        available_minutes=0,
                    )
                )
            )

        self.assertEqual(
            snapshot.total_slots,
            0,
        )
        self.assertEqual(
            snapshot.booked_slots,
            0,
        )
        self.assertEqual(
            snapshot.booked_minutes,
            0,
        )

    async def test_rejects_invalid_context(
        self,
    ):
        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            await (
                MongoCapacityProvider()
                .get_capacity_snapshot(
                    context=object()
                )
            )

    def test_duration_prefers_valid_end_time(
        self,
    ):
        duration = _appointment_duration_minutes(
            {
                "ends_at": (
                    "2026-07-01T10:30:00+00:00"
                ),
                "duration_minutes_snapshot": 15,
            },
            starts_at=datetime(
                2026,
                7,
                1,
                9,
                tzinfo=UTC,
            ),
        )

        self.assertEqual(duration, 90)


class Phase63DCapacityTimezoneQueryTests(unittest.IsolatedAsyncioTestCase):
    async def test_yerevan_window_matches_baseline_and_exact_tenant_query(self):
        from datetime import UTC, date, datetime
        from unittest.mock import patch
        from app.intelligence.capacity import (
            CAPACITY_BASELINE_METADATA_KEY,
            CapacityBaseline,
        )
        from app.intelligence.context import IntelligenceContext
        from app.intelligence.models import AnalysisWindow
        from app.intelligence.providers.mongo_capacity_provider import (
            MongoCapacityProvider,
        )

        class Cursor:
            def __init__(self):
                self.sort_args = None

            def sort(self, key, direction):
                self.sort_args = (key, direction)
                return self

            async def to_list(self, *, length):
                return []

        class Collection:
            def __init__(self):
                self.query = None
                self.find_calls = 0
                self.cursor = None

            def find(self, query):
                self.query = query
                self.find_calls += 1
                self.cursor = Cursor()
                return self.cursor

        class DB:
            def __init__(self):
                self.appointments = Collection()

        period_start = datetime(2026, 6, 30, 20, tzinfo=UTC)
        period_end = datetime(2026, 7, 7, 20, tzinfo=UTC)
        baseline = CapacityBaseline(
            owner_id="tenant-a",
            period_start=period_start,
            period_end=period_end,
            total_slots=10,
            active_staff_count=2,
            available_minutes=960,
            source="staff_schedule",
        )
        context = IntelligenceContext(
            owner_id="tenant-a",
            generated_at=datetime(2026, 7, 8, 12, tzinfo=UTC),
            timezone="Asia/Yerevan",
            window=AnalysisWindow(
                start=date(2026, 7, 1),
                end=date(2026, 7, 7),
                label="7d",
            ),
            metadata={CAPACITY_BASELINE_METADATA_KEY: baseline},
        )
        db = DB()
        with patch(
            "app.intelligence.providers.mongo_capacity_provider.get_database",
            return_value=db,
        ):
            snapshot = await MongoCapacityProvider().get_capacity_snapshot(
                context=context
            )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.period_start, period_start)
        self.assertEqual(snapshot.period_end, period_end)
        self.assertEqual(db.appointments.find_calls, 1)
        self.assertEqual(
            db.appointments.query,
            {
                "owner_id": "tenant-a",
                "status": {"$in": ["completed", "scheduled"]},
                "starts_at": {
                    "$gte": "2026-06-30T20:00:00+00:00",
                    "$lt": "2026-07-07T20:00:00+00:00",
                },
            },
        )

if __name__ == "__main__":
    unittest.main()
