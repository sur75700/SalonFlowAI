from __future__ import annotations

import asyncio
import unittest
from datetime import UTC, date, datetime

from app.reports.daily_summary import build_daily_summary_report
from app.reports.models import normalize_report_locale


class _FakeCursor:
    def __init__(self, rows: list[dict]) -> None:
        self._rows = rows
        self.sort_calls: list[tuple[str, int]] = []
        self.to_list_lengths: list[int] = []

    def sort(self, key: str, direction: int) -> "_FakeCursor":
        self.sort_calls.append((key, direction))
        return self

    async def to_list(self, *, length: int) -> list[dict]:
        self.to_list_lengths.append(length)
        return list(self._rows[:length])


class _FakeCollection:
    def __init__(
        self,
        *,
        rows: list[dict] | None = None,
        count: int = 0,
    ) -> None:
        self.rows = rows or []
        self.count = count
        self.find_queries: list[dict] = []
        self.count_queries: list[dict] = []
        self.cursor: _FakeCursor | None = None

    def find(self, query: dict) -> _FakeCursor:
        self.find_queries.append(query)
        self.cursor = _FakeCursor(self.rows)
        return self.cursor

    async def count_documents(self, query: dict) -> int:
        self.count_queries.append(query)
        return self.count


class _FakeDatabase:
    def __init__(self) -> None:
        self.appointments = _FakeCollection(
            rows=[
                {
                    "starts_at": "2026-08-16T09:00:00+00:00",
                    "client_name": "A",
                    "service_name": "Cut",
                    "status": "scheduled",
                    "notes": "First",
                },
                {
                    "starts_at": "2026-08-16T10:00:00+00:00",
                    "client_name": "B",
                    "service_name": "Color",
                    "status": "COMPLETED",
                    "notes": None,
                },
                {
                    "starts_at": "2026-08-16T11:00:00+00:00",
                    "client_name": "C",
                    "service_name": "Style",
                    "status": "cancelled",
                    "notes": "",
                },
            ],
            count=44,
        )
        self.clients = _FakeCollection(count=12)
        self.services = _FakeCollection(count=7)


class DailySummaryReportTests(unittest.TestCase):
    def test_build_daily_summary_report_is_owner_scoped_and_deterministic(
        self,
    ) -> None:
        database = _FakeDatabase()
        generated_at = datetime(
            2026,
            8,
            16,
            12,
            0,
            tzinfo=UTC,
        )

        report = asyncio.run(
            build_daily_summary_report(
                database=database,
                owner_id="owner-123",
                report_date=date(2026, 8, 16),
                locale="hy",
                generated_at=generated_at,
            )
        )

        self.assertEqual(report.owner_id, "owner-123")
        self.assertEqual(report.report_date, date(2026, 8, 16))
        self.assertEqual(report.generated_at, generated_at)
        self.assertEqual(report.locale, "hy")

        self.assertEqual(report.metrics.total_clients, 12)
        self.assertEqual(report.metrics.total_services, 7)
        self.assertEqual(report.metrics.total_appointments, 44)
        self.assertEqual(report.metrics.appointments_on_date, 3)
        self.assertEqual(report.metrics.scheduled_on_date, 1)
        self.assertEqual(report.metrics.completed_on_date, 1)
        self.assertEqual(report.metrics.cancelled_on_date, 1)

        self.assertEqual(
            tuple(item.status for item in report.appointments),
            ("scheduled", "completed", "cancelled"),
        )
        self.assertEqual(report.appointments[1].notes, "-")
        self.assertEqual(report.appointments[2].notes, "-")

        self.assertEqual(
            database.appointments.find_queries,
            [
                {
                    "owner_id": "owner-123",
                    "starts_at": {
                        "$gte": "2026-08-16T00:00:00+00:00",
                        "$lte": "2026-08-16T23:59:59.999999+00:00",
                    },
                }
            ],
        )

        self.assertIsNotNone(database.appointments.cursor)
        assert database.appointments.cursor is not None
        self.assertEqual(
            database.appointments.cursor.sort_calls,
            [("starts_at", 1)],
        )
        self.assertEqual(
            database.appointments.cursor.to_list_lengths,
            [500],
        )

        expected_owner_query = {"owner_id": "owner-123"}
        self.assertEqual(
            database.clients.count_queries,
            [expected_owner_query],
        )
        self.assertEqual(
            database.services.count_queries,
            [expected_owner_query],
        )
        self.assertEqual(
            database.appointments.count_queries,
            [expected_owner_query],
        )

    def test_build_daily_summary_report_fails_closed_without_database(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            RuntimeError,
            "Database not connected",
        ):
            asyncio.run(
                build_daily_summary_report(
                    database=None,
                    owner_id="owner-123",
                    report_date=date(2026, 8, 16),
                    locale="en",
                )
            )

    def test_build_daily_summary_report_rejects_empty_owner(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "owner_id is required",
        ):
            asyncio.run(
                build_daily_summary_report(
                    database=_FakeDatabase(),
                    owner_id="   ",
                    report_date=date(2026, 8, 16),
                    locale="en",
                )
            )

    def test_normalize_report_locale_is_strict_and_has_english_fallback(
        self,
    ) -> None:
        self.assertEqual(normalize_report_locale("en"), "en")
        self.assertEqual(normalize_report_locale("HY"), "hy")
        self.assertEqual(normalize_report_locale(" ru "), "ru")
        self.assertEqual(normalize_report_locale("fr"), "fr")
        self.assertEqual(normalize_report_locale("de"), "en")
        self.assertEqual(normalize_report_locale(None), "en")


if __name__ == "__main__":
    unittest.main()
