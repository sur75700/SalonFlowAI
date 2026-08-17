import inspect
import unittest
from datetime import UTC, date, datetime
from unittest.mock import patch

from app.intelligence.context import IntelligenceContext
from app.intelligence.models import AnalysisWindow
from app.intelligence.providers.mongo_service_provider import (
    MongoServiceProvider,
)
from app.intelligence.service_intelligence import (
    ServiceProvider,
)


class FakeCursor:
    def __init__(self, documents):
        self.documents = list(documents)
        self.sort_args = None
        self.requested_length = None

    def sort(self, key, direction):
        self.sort_args = (key, direction)
        return self

    async def to_list(self, *, length):
        self.requested_length = length
        return list(self.documents[:length])


class FakeCollection:
    def __init__(self, documents):
        self.documents = list(documents)
        self.query = None
        self.find_calls = 0
        self.cursor = None

    def find(self, query):
        self.query = query
        self.find_calls += 1
        self.cursor = FakeCursor(self.documents)
        return self.cursor


class FakeDatabase:
    def __init__(
        self,
        *,
        services,
        appointments,
    ):
        self.services = FakeCollection(services)
        self.appointments = FakeCollection(
            appointments
        )


class MongoServiceProviderTests(
    unittest.IsolatedAsyncioTestCase
):
    def build_context(
        self,
        *,
        currency="USD",
        window=True,
        generated_at=None,
    ):
        analysis_window = (
            AnalysisWindow(
                start=date(2026, 7, 1),
                end=date(2026, 7, 7),
                label="7d",
            )
            if window
            else None
        )

        return IntelligenceContext(
            owner_id="tenant-a",
            currency=currency,
            generated_at=(
                generated_at
                or datetime(
                    2026,
                    7,
                    8,
                    12,
                    tzinfo=UTC,
                )
            ),
            window=analysis_window,
        )

    async def test_builds_ranked_period_snapshot(
        self,
    ):
        services = [
            {
                "_id": "service-a",
                "owner_id": "tenant-a",
                "name": "Haircut",
                "duration_minutes": 60,
                "price": 100,
                "currency": "USD",
                "is_active": True,
            },
            {
                "_id": "service-b",
                "owner_id": "tenant-a",
                "name": "Color",
                "duration_minutes": 90,
                "price": 200,
                "currency": "USD",
                "is_active": False,
            },
            {
                "_id": "service-eur",
                "owner_id": "tenant-a",
                "name": "EUR Service",
                "duration_minutes": 30,
                "price": 50,
                "currency": "EUR",
                "is_active": True,
            },
            {
                "_id": "foreign-service",
                "owner_id": "tenant-b",
                "name": "Foreign",
                "duration_minutes": 30,
                "price": 50,
                "currency": "USD",
                "is_active": True,
            },
        ]

        appointments = [
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-01T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 120.50,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "scheduled",
                "starts_at": (
                    "2026-07-02T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 100,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "cancelled",
                "starts_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 80,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "no_show",
                "starts_at": (
                    "2026-07-04T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 50,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-b",
                "status": "completed",
                "starts_at": (
                    "2026-07-05T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 200,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-06T09:00:00+00:00"
                ),
                "currency_snapshot": "EUR",
                "price_snapshot": 999,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "orphan-service",
                "status": "completed",
                "starts_at": (
                    "2026-07-06T10:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 999,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "completed",
                "starts_at": "invalid-date",
                "currency_snapshot": "USD",
                "price_snapshot": 999,
            },
            {
                "owner_id": "tenant-a",
                "service_id": "service-a",
                "status": "completed",
                "starts_at": (
                    "2026-06-30T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 999,
            },
            {
                "owner_id": "tenant-b",
                "service_id": "foreign-service",
                "status": "completed",
                "starts_at": (
                    "2026-07-06T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 999,
            },
        ]

        database = FakeDatabase(
            services=services,
            appointments=appointments,
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "USD")
        self.assertEqual(snapshot.total_service_count, 3)
        self.assertEqual(snapshot.active_service_count, 1)

        self.assertEqual(
            snapshot.period_start,
            datetime(2026, 7, 1, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.period_end,
            datetime(2026, 7, 8, tzinfo=UTC),
        )

        self.assertEqual(
            tuple(
                item.service_id
                for item in snapshot.services
            ),
            (
                "orphan-service",
                "service-b",
                "service-a",
            ),
        )

        (
            orphan_service,
            service_b,
            service_a,
        ) = snapshot.services

        self.assertEqual(
            orphan_service.service_id,
            "orphan-service",
        )
        self.assertEqual(
            orphan_service.name,
            "orphan-service",
        )
        self.assertFalse(
            orphan_service.catalog_present
        )
        self.assertFalse(
            orphan_service.is_active
        )
        self.assertEqual(
            orphan_service.duration_minutes,
            0,
        )
        self.assertEqual(
            orphan_service.configured_price_minor,
            0,
        )
        self.assertEqual(
            orphan_service.appointment_count,
            1,
        )
        self.assertEqual(
            orphan_service.completed_booking_count,
            1,
        )
        self.assertEqual(
            orphan_service.completed_revenue_minor,
            99_900,
        )

        self.assertEqual(
            service_b.completed_revenue_minor,
            20_000,
        )
        self.assertEqual(
            service_b.appointment_count,
            1,
        )

        self.assertEqual(service_a.name, "Haircut")
        self.assertTrue(service_a.catalog_present)
        self.assertTrue(service_a.is_active)
        self.assertEqual(service_a.duration_minutes, 60)
        self.assertEqual(
            service_a.configured_price_minor,
            10_000,
        )
        self.assertEqual(service_a.appointment_count, 4)
        self.assertEqual(
            service_a.completed_booking_count,
            1,
        )
        self.assertEqual(
            service_a.scheduled_booking_count,
            1,
        )
        self.assertEqual(
            service_a.cancelled_booking_count,
            1,
        )
        self.assertEqual(
            service_a.other_booking_count,
            1,
        )
        self.assertEqual(
            service_a.completed_revenue_minor,
            12_050,
        )
        self.assertEqual(
            service_a.scheduled_value_minor,
            10_000,
        )
        self.assertEqual(
            service_a.cancelled_value_minor,
            8_000,
        )
        self.assertEqual(
            service_a.demand_booking_count,
            2,
        )

        self.assertEqual(
            database.services.query,
            {
                "owner_id": "tenant-a",
            },
        )

        self.assertEqual(
            database.appointments.query,
            {
                "owner_id": "tenant-a",
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
            database.services.cursor.sort_args,
            ("name", 1),
        )
        self.assertEqual(
            database.appointments.cursor.sort_args,
            ("starts_at", 1),
        )

    async def test_preserves_currency_mutated_history(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Current EUR Name",
                    "duration_minutes": 90,
                    "price": 50,
                    "currency": "EUR",
                    "is_active": True,
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "service-a",
                    "service_name": "Historical USD Name",
                    "duration_minutes_snapshot": 45,
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 25,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.total_service_count,
            1,
        )
        self.assertEqual(
            snapshot.active_service_count,
            0,
        )

        service = snapshot.services[0]

        self.assertEqual(
            service.service_id,
            "service-a",
        )
        self.assertEqual(
            service.name,
            "Historical USD Name",
        )
        self.assertFalse(service.catalog_present)
        self.assertFalse(service.is_active)
        self.assertEqual(service.duration_minutes, 45)
        self.assertEqual(
            service.configured_price_minor,
            0,
        )
        self.assertEqual(
            service.completed_revenue_minor,
            2_500,
        )

    async def test_preserves_orphan_service_history(
        self,
    ):
        database = FakeDatabase(
            services=[],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "legacy-service",
                    "service_name": "Legacy Service",
                    "duration_minutes_snapshot": 60,
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 40,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertEqual(
            service.service_id,
            "legacy-service",
        )
        self.assertEqual(
            service.name,
            "Legacy Service",
        )
        self.assertFalse(service.catalog_present)
        self.assertFalse(service.is_active)
        self.assertEqual(service.duration_minutes, 60)
        self.assertEqual(
            service.completed_revenue_minor,
            4_000,
        )

    async def test_historical_service_uses_latest_metadata(
        self,
    ):
        database = FakeDatabase(
            services=[],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "legacy-service",
                    "service_name": "Old Name",
                    "duration_minutes_snapshot": 30,
                    "status": "scheduled",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 20,
                },
                {
                    "owner_id": "tenant-a",
                    "service_id": "legacy-service",
                    "service_name": "New Name",
                    "duration_minutes_snapshot": 75,
                    "status": "completed",
                    "starts_at": (
                        "2026-07-05T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 30,
                },
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertEqual(service.name, "New Name")
        self.assertEqual(service.duration_minutes, 75)
        self.assertEqual(service.appointment_count, 2)
        self.assertEqual(
            service.completed_revenue_minor,
            3_000,
        )
        self.assertEqual(
            service.scheduled_value_minor,
            2_000,
        )

    async def test_historical_service_without_duration_is_retained(
        self,
    ):
        database = FakeDatabase(
            services=[],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "legacy-service",
                    "service_name": "Legacy Service",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 15,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertFalse(service.catalog_present)
        self.assertEqual(service.duration_minutes, 0)
        self.assertEqual(
            service.completed_revenue_minor,
            1_500,
        )

    async def test_booking_value_uses_appointment_snapshot(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Haircut",
                    "duration_minutes": 60,
                    "price": 999,
                    "currency": "USD",
                    "is_active": True,
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "service-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 25,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertEqual(
            service.configured_price_minor,
            99_900,
        )
        self.assertEqual(
            service.completed_revenue_minor,
            2_500,
        )

    async def test_missing_currencies_use_context_currency(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Haircut",
                    "duration_minutes": 60,
                    "price": 12.34,
                    "is_active": True,
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "service-a",
                    "status": "scheduled",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "price_snapshot": 10.50,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertEqual(
            service.configured_price_minor,
            1_234,
        )
        self.assertEqual(
            service.scheduled_value_minor,
            1_050,
        )

    async def test_invalid_price_is_zero_but_booking_counts(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Haircut",
                    "duration_minutes": 60,
                    "price": "nan",
                    "currency": "USD",
                    "is_active": True,
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "service_id": "service-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": "invalid",
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        service = snapshot.services[0]

        self.assertEqual(service.appointment_count, 1)
        self.assertEqual(
            service.completed_booking_count,
            1,
        )
        self.assertEqual(
            service.configured_price_minor,
            0,
        )
        self.assertEqual(
            service.completed_revenue_minor,
            0,
        )

    async def test_empty_catalog_is_valid(
        self,
    ):
        database = FakeDatabase(
            services=[],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(snapshot.total_service_count, 0)
        self.assertEqual(snapshot.active_service_count, 0)
        self.assertEqual(snapshot.services, ())

    async def test_default_window_is_rolling_thirty_days(
        self,
    ):
        generated_at = datetime(
            2026,
            8,
            1,
            12,
            tzinfo=UTC,
        )

        database = FakeDatabase(
            services=[],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=self.build_context(
                        window=False,
                        generated_at=generated_at,
                    )
                )
            )

        self.assertEqual(
            snapshot.period_end,
            generated_at,
        )
        self.assertEqual(
            snapshot.period_start,
            datetime(
                2026,
                7,
                2,
                12,
                tzinfo=UTC,
            ),
        )

    async def test_invalid_catalog_duration_fails_closed(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Haircut",
                    "duration_minutes": 0,
                    "price": 10,
                    "currency": "USD",
                    "is_active": True,
                }
            ],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "invalid duration",
            ):
                await (
                    MongoServiceProvider()
                    .get_service_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_invalid_catalog_active_state_fails_closed(
        self,
    ):
        database = FakeDatabase(
            services=[
                {
                    "_id": "service-a",
                    "owner_id": "tenant-a",
                    "name": "Haircut",
                    "duration_minutes": 60,
                    "price": 10,
                    "currency": "USD",
                    "is_active": 1,
                }
            ],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "invalid active state",
            ):
                await (
                    MongoServiceProvider()
                    .get_service_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_missing_database_fails_closed(
        self,
    ):
        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=None,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "Database not connected",
            ):
                await (
                    MongoServiceProvider()
                    .get_service_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_service_limit_fails_closed(
        self,
    ):
        database = FakeDatabase(
            services=[
                {}
                for _ in range(5_001)
            ],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "service collection exceeds",
            ):
                await (
                    MongoServiceProvider()
                    .get_service_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_appointment_limit_fails_closed(
        self,
    ):
        database = FakeDatabase(
            services=[],
            appointments=[
                {}
                for _ in range(5_001)
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_service_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "appointment history exceeds",
            ):
                await (
                    MongoServiceProvider()
                    .get_service_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_rejects_invalid_context(
        self,
    ):
        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            await (
                MongoServiceProvider()
                .get_service_snapshot(
                    context=object()
                )
            )

    def test_runtime_protocol_is_satisfied(
        self,
    ):
        provider = MongoServiceProvider()

        self.assertTrue(
            inspect.iscoroutinefunction(
                provider.get_service_snapshot
            )
        )
        self.assertIsInstance(
            provider,
            ServiceProvider,
        )


class Phase63DServiceTimezoneQueryTests(unittest.IsolatedAsyncioTestCase):
    async def test_yerevan_calendar_window_drives_exact_tenant_query(self):
        from datetime import UTC, date, datetime
        from unittest.mock import patch
        from app.intelligence.context import IntelligenceContext
        from app.intelligence.models import AnalysisWindow
        from app.intelligence.providers.mongo_service_provider import (
            MongoServiceProvider,
        )

        class Cursor:
            def __init__(self):
                self.sort_args = None

            def sort(self, key, direction):
                self.sort_args = (key, direction)
                return self

            def limit(self, value):
                return self

            async def to_list(self, *, length):
                return []

        class Collection:
            def __init__(self):
                self.queries = []
                self.cursor = None

            def find(self, query):
                self.queries.append(query)
                self.cursor = Cursor()
                return self.cursor

            async def find_one(self, query):
                self.queries.append(query)
                return None

            async def count_documents(self, query):
                self.queries.append(query)
                return 0

        class DB:
            def __init__(self):
                self.appointments = Collection()
                self.clients = Collection()
                self.services = Collection()

        db = DB()
        context = IntelligenceContext(
            owner_id="tenant-a",
            currency="AMD",
            generated_at=datetime(2026, 7, 8, 12, tzinfo=UTC),
            timezone="Asia/Yerevan",
            window=AnalysisWindow(
                start=date(2026, 7, 1),
                end=date(2026, 7, 7),
                label="7d",
            ),
        )
        with patch(
            "app.intelligence.providers.mongo_service_provider.get_database",
            return_value=db,
        ):
            snapshot = await MongoServiceProvider().get_service_snapshot(
                context=context
            )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(
            snapshot.period_start,
            datetime(2026, 6, 30, 20, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.period_end,
            datetime(2026, 7, 7, 20, tzinfo=UTC),
        )
        matches = [
            query
            for query in db.appointments.queries
            if isinstance(query, dict) and "starts_at" in query
        ]
        self.assertEqual(len(matches), 1)
        query = matches[0]
        self.assertEqual(query.get("owner_id"), "tenant-a")
        self.assertEqual(
            query["starts_at"],
            {
                "$gte": "2026-06-30T20:00:00+00:00",
                "$lt": "2026-07-07T20:00:00+00:00",
            },
        )

if __name__ == "__main__":
    unittest.main()
