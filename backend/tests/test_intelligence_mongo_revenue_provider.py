import unittest
from datetime import UTC, date, datetime
from unittest.mock import patch

from app.intelligence import IntelligenceContext
from app.intelligence.models import AnalysisWindow
from app.intelligence.providers.mongo_revenue_provider import (
    MongoRevenueProvider,
    _money_to_minor,
)


class FakeCursor:
    def __init__(self, documents):
        self.documents = documents
        self.sort_args = None
        self.limit = None

    def sort(self, key, direction):
        self.sort_args = (key, direction)
        return self

    async def to_list(self, *, length):
        self.limit = length
        return list(self.documents[:length])


class FakeCollection:
    def __init__(self, documents):
        self.documents = documents
        self.query = None
        self.cursor = None

    def find(self, query):
        self.query = query
        self.cursor = FakeCursor(self.documents)
        return self.cursor


class FakeDatabase:
    def __init__(self, documents):
        self.appointments = FakeCollection(documents)


class MongoRevenueProviderTests(
    unittest.IsolatedAsyncioTestCase
):
    def build_context(self):
        return IntelligenceContext(
            owner_id="tenant-a",
            currency="amd",
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
        )

    async def test_builds_period_aware_snapshot(self):
        documents = [
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "price_snapshot": 1_000,
                "currency_snapshot": "AMD",
                "starts_at": "2026-07-01T09:00:00+00:00",
            },
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "price_snapshot": 2_000,
                "currency_snapshot": "AMD",
                "starts_at": "2026-07-07T18:00:00+00:00",
            },
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "price_snapshot": 500,
                "currency_snapshot": "AMD",
                "starts_at": "2026-06-24T12:00:00+00:00",
            },
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "price_snapshot": 700,
                "currency_snapshot": "AMD",
                "starts_at": "2026-06-30T12:00:00+00:00",
            },
            {
                "owner_id": "tenant-a",
                "status": "scheduled",
                "price_snapshot": 99_999,
                "currency_snapshot": "AMD",
                "starts_at": "2026-07-03T12:00:00+00:00",
            },
            {
                "owner_id": "tenant-b",
                "status": "completed",
                "price_snapshot": 99_999,
                "currency_snapshot": "AMD",
                "starts_at": "2026-07-03T12:00:00+00:00",
            },
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "price_snapshot": 100,
                "currency_snapshot": "USD",
                "starts_at": "2026-07-03T12:00:00+00:00",
            },
        ]

        database = FakeDatabase(documents)

        with patch(
            "app.intelligence.providers."
            "mongo_revenue_provider.get_database",
            return_value=database,
        ):
            snapshot = await MongoRevenueProvider().get_revenue_snapshot(
                context=self.build_context()
            )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "AMD")
        self.assertEqual(
            snapshot.period_start,
            datetime(2026, 7, 1, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.period_end,
            datetime(2026, 7, 8, tzinfo=UTC),
        )
        self.assertEqual(
            snapshot.completed_booking_count,
            2,
        )
        self.assertEqual(
            snapshot.gross_revenue_minor,
            3_000,
        )
        self.assertEqual(
            snapshot.previous_gross_revenue_minor,
            1_200,
        )
        self.assertEqual(
            snapshot.average_ticket_minor,
            1_500,
        )

        self.assertEqual(
            database.appointments.query,
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "starts_at": {
                    "$gte": "2026-06-24T00:00:00+00:00",
                    "$lt": "2026-07-08T00:00:00+00:00",
                },
            },
        )

        self.assertEqual(
            database.appointments.cursor.sort_args,
            ("starts_at", 1),
        )

    async def test_missing_database_fails_closed(self):
        with patch(
            "app.intelligence.providers."
            "mongo_revenue_provider.get_database",
            return_value=None,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "Database not connected",
            ):
                await MongoRevenueProvider().get_revenue_snapshot(
                    context=self.build_context()
                )

    async def test_rejects_invalid_context(self):
        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            await MongoRevenueProvider().get_revenue_snapshot(
                context=object()
            )

    async def test_skips_invalid_timestamp(self):
        database = FakeDatabase(
            [
                {
                    "owner_id": "tenant-a",
                    "status": "completed",
                    "price_snapshot": 5_000,
                    "currency_snapshot": "AMD",
                    "starts_at": "not-a-date",
                }
            ]
        )

        with patch(
            "app.intelligence.providers."
            "mongo_revenue_provider.get_database",
            return_value=database,
        ):
            snapshot = await MongoRevenueProvider().get_revenue_snapshot(
                context=self.build_context()
            )

        self.assertEqual(snapshot.gross_revenue_minor, 0)
        self.assertEqual(
            snapshot.completed_booking_count,
            0,
        )
        self.assertEqual(
            snapshot.average_ticket_minor,
            0,
        )

    def test_money_conversion_respects_currency_scale(self):
        self.assertEqual(
            _money_to_minor(1_250.4, currency="AMD"),
            1_250,
        )
        self.assertEqual(
            _money_to_minor("12.34", currency="USD"),
            1_234,
        )

    def test_invalid_money_becomes_zero(self):
        self.assertEqual(
            _money_to_minor("invalid", currency="AMD"),
            0,
        )
        self.assertEqual(
            _money_to_minor(-50, currency="AMD"),
            0,
        )


if __name__ == "__main__":
    unittest.main()
