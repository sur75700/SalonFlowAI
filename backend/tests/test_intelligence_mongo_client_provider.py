import inspect
import unittest
from datetime import UTC, date, datetime
from unittest.mock import patch

from app.intelligence.client_intelligence import (
    ClientProvider,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.models import AnalysisWindow
from app.intelligence.providers.mongo_client_provider import (
    MongoClientProvider,
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
    def __init__(
        self,
        *,
        clients,
        appointments,
    ):
        self.clients = FakeCollection(clients)
        self.appointments = FakeCollection(
            appointments
        )


class MongoClientProviderTests(
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

    async def test_builds_period_aware_snapshot(
        self,
    ):
        clients = [
            {
                "_id": "client-a",
                "owner_id": "tenant-a",
                "created_at": (
                    "2026-06-01T09:00:00+00:00"
                ),
            },
            {
                "_id": "client-b",
                "owner_id": "tenant-a",
                "created_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
            },
            {
                "_id": "client-c",
                "owner_id": "tenant-a",
                "created_at": (
                    "2026-05-01T09:00:00+00:00"
                ),
            },
            {
                "_id": "client-d",
                "owner_id": "tenant-a",
                "created_at": (
                    "2026-05-02T09:00:00+00:00"
                ),
            },
            {
                "_id": "foreign-client",
                "owner_id": "tenant-b",
                "created_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
            },
        ]

        appointments = [
            {
                "owner_id": "tenant-a",
                "client_id": "client-a",
                "status": "completed",
                "starts_at": (
                    "2026-06-20T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 20,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-01T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 100.25,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-02T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 149.75,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-b",
                "status": "completed",
                "starts_at": (
                    "2026-07-03T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 50,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-c",
                "status": "completed",
                "starts_at": (
                    "2026-06-15T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 80,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-a",
                "status": "completed",
                "starts_at": (
                    "2026-07-04T09:00:00+00:00"
                ),
                "currency_snapshot": "EUR",
                "price_snapshot": 999,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-a",
                "status": "cancelled",
                "starts_at": (
                    "2026-07-05T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 500,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "client-d",
                "status": "completed",
                "starts_at": "invalid-date",
                "currency_snapshot": "USD",
                "price_snapshot": 500,
            },
            {
                "owner_id": "tenant-a",
                "client_id": "orphan-client",
                "status": "completed",
                "starts_at": (
                    "2026-07-05T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 500,
            },
            {
                "owner_id": "tenant-b",
                "client_id": "foreign-client",
                "status": "completed",
                "starts_at": (
                    "2026-07-05T09:00:00+00:00"
                ),
                "currency_snapshot": "USD",
                "price_snapshot": 500,
            },
        ]

        database = FakeDatabase(
            clients=clients,
            appointments=appointments,
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "USD")

        self.assertEqual(
            snapshot.period_start,
            datetime(2026, 7, 1, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.period_end,
            datetime(2026, 7, 8, tzinfo=UTC),
        )

        self.assertEqual(
            snapshot.total_client_count,
            4,
        )
        self.assertEqual(
            snapshot.new_client_count,
            1,
        )
        self.assertEqual(
            snapshot.active_client_count,
            2,
        )
        self.assertEqual(
            snapshot.returning_client_count,
            1,
        )
        self.assertEqual(
            snapshot.historically_active_client_count,
            2,
        )
        self.assertEqual(
            snapshot.at_risk_client_count,
            1,
        )
        self.assertEqual(
            snapshot.high_value_client_count,
            1,
        )
        self.assertEqual(
            snapshot.completed_booking_count,
            3,
        )
        self.assertEqual(
            snapshot.completed_revenue_minor,
            30_000,
        )

        self.assertEqual(
            database.clients.query,
            {
                "owner_id": "tenant-a",
            },
        )

        self.assertEqual(
            database.appointments.query,
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "starts_at": {
                    "$lt": (
                        "2026-07-08T00:00:00+00:00"
                    ),
                },
            },
        )

        self.assertEqual(
            database.clients.cursor.sort_args,
            ("created_at", 1),
        )
        self.assertEqual(
            database.appointments.cursor.sort_args,
            ("starts_at", 1),
        )

    async def test_missing_currency_uses_context_currency(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "price_snapshot": 12.34,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.completed_booking_count,
            1,
        )
        self.assertEqual(
            snapshot.completed_revenue_minor,
            1_234,
        )

    async def test_invalid_price_is_zero_but_booking_counts(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": "nan",
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.active_client_count,
            1,
        )
        self.assertEqual(
            snapshot.completed_booking_count,
            1,
        )
        self.assertEqual(
            snapshot.completed_revenue_minor,
            0,
        )
        self.assertEqual(
            snapshot.high_value_client_count,
            0,
        )

    async def test_other_currency_history_is_ignored(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-06-20T09:00:00+00:00"
                    ),
                    "currency_snapshot": "EUR",
                    "price_snapshot": 100,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.historically_active_client_count,
            0,
        )
        self.assertEqual(
            snapshot.at_risk_client_count,
            0,
        )

    async def test_invalid_timestamp_is_skipped(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                }
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-a",
                    "status": "completed",
                    "starts_at": "invalid",
                    "currency_snapshot": "USD",
                    "price_snapshot": 100,
                }
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.active_client_count,
            0,
        )
        self.assertEqual(
            snapshot.completed_booking_count,
            0,
        )

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
            clients=[],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
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

    async def test_missing_database_fails_closed(
        self,
    ):
        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=None,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "Database not connected",
            ):
                await (
                    MongoClientProvider()
                    .get_client_snapshot(
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
                MongoClientProvider()
                .get_client_snapshot(
                    context=object()
                )
            )

    async def test_client_limit_fails_closed(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {"_id": index}
                for index in range(5_001)
            ],
            appointments=[],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "client collection exceeds",
            ):
                await (
                    MongoClientProvider()
                    .get_client_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_appointment_limit_fails_closed(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                }
            ],
            appointments=[
                {}
                for _ in range(5_001)
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "appointment history exceeds",
            ):
                await (
                    MongoClientProvider()
                    .get_client_snapshot(
                        context=self.build_context()
                    )
                )

    async def test_high_value_uses_positive_average(
        self,
    ):
        database = FakeDatabase(
            clients=[
                {
                    "_id": "client-a",
                    "owner_id": "tenant-a",
                },
                {
                    "_id": "client-b",
                    "owner_id": "tenant-a",
                },
                {
                    "_id": "client-c",
                    "owner_id": "tenant-a",
                },
            ],
            appointments=[
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-a",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T09:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 100,
                },
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-b",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T10:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": 50,
                },
                {
                    "owner_id": "tenant-a",
                    "client_id": "client-c",
                    "status": "completed",
                    "starts_at": (
                        "2026-07-02T11:00:00+00:00"
                    ),
                    "currency_snapshot": "USD",
                    "price_snapshot": "invalid",
                },
            ],
        )

        with patch(
            "app.intelligence.providers."
            "mongo_client_provider.get_database",
            return_value=database,
        ):
            snapshot = await (
                MongoClientProvider()
                .get_client_snapshot(
                    context=self.build_context()
                )
            )

        self.assertEqual(
            snapshot.active_client_count,
            3,
        )
        self.assertEqual(
            snapshot.high_value_client_count,
            1,
        )

    def test_runtime_protocol_is_satisfied(
        self,
    ):
        provider = MongoClientProvider()

        self.assertTrue(
            inspect.iscoroutinefunction(
                provider.get_client_snapshot
            )
        )
        self.assertIsInstance(
            provider,
            ClientProvider,
        )


class Phase63DClientTimezoneQueryTests(unittest.IsolatedAsyncioTestCase):
    async def test_yerevan_calendar_window_drives_exact_tenant_query(self):
        from datetime import UTC, date, datetime
        from unittest.mock import patch
        from app.intelligence.context import IntelligenceContext
        from app.intelligence.models import AnalysisWindow
        from app.intelligence.providers.mongo_client_provider import (
            MongoClientProvider,
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
            "app.intelligence.providers.mongo_client_provider.get_database",
            return_value=db,
        ):
            snapshot = await MongoClientProvider().get_client_snapshot(
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
                "$lt": "2026-07-07T20:00:00+00:00",
            },
        )

if __name__ == "__main__":
    unittest.main()
