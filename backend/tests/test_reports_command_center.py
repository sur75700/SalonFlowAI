import unittest
from datetime import UTC, date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.intelligence.capacity import CapacityDataUnavailable
from app.reports.command_center import build_report_document
from app.reports.contracts import (
    ReportContractError,
    normalize_report_filters,
)


OWNER = "64b64c64b64c64b64c64b64c"


class FakeCursor:
    def __init__(self, documents):
        self.documents = list(documents)
        self.length = None

    def sort(self, *_args):
        return self

    async def to_list(self, length):
        self.length = length
        return self.documents[:length]


class FakeCollection:
    def __init__(self, *, one=None, documents=(), count=0):
        self.one = one
        self.documents = list(documents)
        self.count = count
        self.last_query = None
        self.cursor = None

    async def find_one(self, query):
        self.last_query = query
        return self.one

    async def count_documents(self, query):
        self.last_query = query
        return self.count

    def find(self, query):
        self.last_query = query
        self.cursor = FakeCursor(self.documents)
        return self.cursor


class FakeDatabase:
    def __init__(self, *, timezone="UTC", appointments=()):
        profile = (
            {"owner_id": OWNER, "status": "active", "timezone": timezone}
            if timezone is not None
            else None
        )
        self.salon_capacity_profiles = FakeCollection(one=profile)
        self.appointments = FakeCollection(documents=appointments)
        self.services = FakeCollection(
            one={"owner_id": OWNER, "currency": "AMD"}
        )
        self.clients = FakeCollection()


class RevenueProvider:
    async def get_revenue_snapshot(self, *, context):
        return SimpleNamespace(
            owner_id=context.owner_id,
            period_start=datetime(2026, 8, 16, 20, tzinfo=UTC),
            period_end=datetime(2026, 8, 17, 20, tzinfo=UTC),
            currency="AMD",
            completed_booking_count=2,
            gross_revenue_minor=20_000,
            previous_gross_revenue_minor=10_000,
            average_ticket_minor=10_000,
        )


class ClientProvider:
    async def get_client_snapshot(self, *, context):
        return SimpleNamespace(
            owner_id=context.owner_id,
            period_start=datetime(2026, 8, 16, 20, tzinfo=UTC),
            period_end=datetime(2026, 8, 17, 20, tzinfo=UTC),
            currency=context.currency,
            total_client_count=5,
            new_client_count=1,
            active_client_count=3,
            returning_client_count=2,
            historically_active_client_count=4,
            at_risk_client_count=1,
            high_value_client_count=1,
            completed_booking_count=6,
            completed_revenue_minor=60_000,
        )


class ServiceProvider:
    async def get_service_snapshot(self, *, context):
        return SimpleNamespace(
            owner_id=context.owner_id,
            period_start=datetime(2026, 8, 16, 20, tzinfo=UTC),
            period_end=datetime(2026, 8, 17, 20, tzinfo=UTC),
            currency=context.currency,
            total_service_count=2,
            active_service_count=2,
            services=(
                SimpleNamespace(
                    service_id="64b64c64b64c64b64c64b64d",
                    name="Haircut",
                    catalog_present=True,
                    is_active=True,
                    duration_minutes=45,
                    configured_price_minor=20_000,
                    appointment_count=3,
                    completed_booking_count=2,
                    scheduled_booking_count=1,
                    cancelled_booking_count=0,
                    other_booking_count=0,
                    completed_revenue_minor=40_000,
                    scheduled_value_minor=20_000,
                    cancelled_value_minor=0,
                ),
                SimpleNamespace(
                    service_id="64b64c64b64c64b64c64b64e",
                    name="Color",
                    catalog_present=True,
                    is_active=True,
                    duration_minutes=90,
                    configured_price_minor=35_000,
                    appointment_count=2,
                    completed_booking_count=1,
                    scheduled_booking_count=1,
                    cancelled_booking_count=0,
                    other_booking_count=0,
                    completed_revenue_minor=35_000,
                    scheduled_value_minor=35_000,
                    cancelled_value_minor=0,
                ),
            ),
        )


class ReportCommandCenterTests(unittest.IsolatedAsyncioTestCase):
    async def test_yerevan_calendar_window_drives_owner_query(self) -> None:
        database = FakeDatabase(
            timezone="Asia/Yerevan",
            appointments=[
                {
                    "starts_at": "2026-08-17T08:00:00+00:00",
                    "client_name": "A",
                    "service_name": "Haircut",
                    "status": "scheduled",
                    "notes": "",
                }
            ],
        )
        document = await build_report_document(
            database=database,
            owner_id=OWNER,
            report_type="appointments",
            start_date="2026-08-17",
            end_date="2026-08-17",
            locale="en",
            filters=normalize_report_filters(
                report_type="appointments"
            ),
            generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
        )
        query = database.appointments.last_query
        self.assertEqual(query["owner_id"], OWNER)
        self.assertEqual(
            query["starts_at"],
            {
                "$gte": "2026-08-16T20:00:00+00:00",
                "$lt": "2026-08-17T20:00:00+00:00",
            },
        )
        self.assertEqual(document.total_rows, 1)

    async def test_dst_spring_day_uses_owner_local_23_hour_window(self) -> None:
        database = FakeDatabase(timezone="America/New_York")
        document = await build_report_document(
            database=database,
            owner_id=OWNER,
            report_type="appointments",
            start_date="2026-03-08",
            end_date="2026-03-08",
            locale="en",
            filters=normalize_report_filters(
                report_type="appointments"
            ),
            generated_at=datetime(2026, 3, 8, 12, tzinfo=UTC),
        )
        query = database.appointments.last_query
        self.assertEqual(
            query["starts_at"],
            {
                "$gte": "2026-03-08T05:00:00+00:00",
                "$lt": "2026-03-09T04:00:00+00:00",
            },
        )
        self.assertEqual(
            document.period.end_utc - document.period.start_utc,
            timedelta(hours=23),
        )

    async def test_timezone_fallback_is_explicit(self) -> None:
        database = FakeDatabase(timezone=None)
        document = await build_report_document(
            database=database,
            owner_id=OWNER,
            report_type="appointments",
            start_date="2026-08-17",
            end_date="2026-08-17",
            locale="en",
            filters=normalize_report_filters(
                report_type="appointments"
            ),
            generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
        )
        self.assertIn("timezone_fallback_utc", document.warnings)
        self.assertEqual(document.period.timezone, "UTC")

    async def test_report_too_large_fails_closed(self) -> None:
        database = FakeDatabase(
            appointments=[{"status": "scheduled"}] * 10_001
        )
        with self.assertRaises(ReportContractError) as captured:
            await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="appointments",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=normalize_report_filters(
                    report_type="appointments"
                ),
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(captured.exception.code, "413_report_too_large")

    async def test_revenue_provider_adapter_preserves_period(self) -> None:
        database = FakeDatabase(timezone="Asia/Yerevan")
        with patch(
            "app.reports.command_center.MongoRevenueProvider",
            RevenueProvider,
        ):
            document = await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="revenue-summary",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=normalize_report_filters(
                    report_type="revenue-summary"
                ),
                currency="AMD",
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(document.metrics["gross_revenue_minor"], 20_000)
        self.assertEqual(
            document.period.start_utc,
            datetime(2026, 8, 16, 20, tzinfo=UTC),
        )

    async def test_client_provider_adapter_uses_explicit_currency(self) -> None:
        database = FakeDatabase(timezone="Asia/Yerevan")
        with patch(
            "app.reports.command_center.MongoClientProvider",
            ClientProvider,
        ):
            document = await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="client-summary",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=normalize_report_filters(
                    report_type="client-summary"
                ),
                currency="EUR",
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(document.metrics["currency"], "EUR")
        self.assertEqual(document.metrics["total_client_count"], 5)

    async def test_service_filter_scopes_rows_and_metrics(self) -> None:
        database = FakeDatabase(timezone="Asia/Yerevan")
        selected = "64b64c64b64c64b64c64b64d"
        with patch(
            "app.reports.command_center.MongoServiceProvider",
            ServiceProvider,
        ):
            document = await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="service-performance",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=normalize_report_filters(
                    report_type="service-performance",
                    service_id=[selected],
                ),
                currency="USD",
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(document.metrics["currency"], "USD")
        self.assertEqual(document.metrics["total_service_count"], 1)
        self.assertEqual(document.metrics["active_service_count"], 1)
        self.assertEqual(document.total_rows, 1)
        self.assertEqual(document.rows[0][0], selected)

    async def test_foreign_service_filter_is_fully_empty(self) -> None:
        database = FakeDatabase(timezone="Asia/Yerevan")
        foreign = "64b64c64b64c64b64c64b64f"
        with patch(
            "app.reports.command_center.MongoServiceProvider",
            ServiceProvider,
        ):
            document = await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="service-performance",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=normalize_report_filters(
                    report_type="service-performance",
                    service_id=[foreign],
                ),
                currency="RUB",
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(document.metrics["currency"], "RUB")
        self.assertEqual(document.metrics["total_service_count"], 0)
        self.assertEqual(document.metrics["active_service_count"], 0)
        self.assertEqual(document.total_rows, 0)
        self.assertEqual(document.rows, ())

    async def test_monetary_reports_require_supported_fiat_currency(self) -> None:
        database = FakeDatabase()
        filters = normalize_report_filters(report_type="revenue-summary")

        with self.assertRaises(ReportContractError) as missing:
            await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="revenue-summary",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=filters,
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(missing.exception.code, "422_invalid_report_filter")

        with self.assertRaises(ReportContractError) as btc:
            await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="revenue-summary",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                filters=filters,
                currency="BTC",
                generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            )
        self.assertEqual(btc.exception.code, "422_invalid_report_filter")

    async def test_capacity_unavailable_maps_to_frozen_error(self) -> None:
        database = FakeDatabase()
        with patch(
            "app.reports.command_center.prepare_capacity_context",
            new=AsyncMock(
                side_effect=CapacityDataUnavailable("not configured")
            ),
        ):
            with self.assertRaises(ReportContractError) as captured:
                await build_report_document(
                    database=database,
                    owner_id=OWNER,
                    report_type="capacity-utilization",
                    start_date="2026-08-17",
                    end_date="2026-08-17",
                    locale="en",
                    filters=normalize_report_filters(
                        report_type="capacity-utilization"
                    ),
                    generated_at=datetime(
                        2026,
                        8,
                        17,
                        12,
                        tzinfo=UTC,
                    ),
                )
        self.assertEqual(
            captured.exception.code,
            "422_capacity_unavailable",
        )

    async def test_date_range_limit_and_daily_shape_fail_closed(self) -> None:
        database = FakeDatabase()
        filters = normalize_report_filters(report_type="appointments")
        with self.assertRaises(ReportContractError) as large:
            await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="appointments",
                start_date="2025-01-01",
                end_date="2026-08-17",
                locale="en",
                filters=filters,
            )
        self.assertEqual(
            large.exception.code,
            "422_report_date_range_too_large",
        )

        with self.assertRaises(ReportContractError) as daily:
            await build_report_document(
                database=database,
                owner_id=OWNER,
                report_type="daily-summary",
                start_date="2026-08-17",
                end_date="2026-08-18",
                locale="en",
                filters=normalize_report_filters(
                    report_type="daily-summary"
                ),
            )
        self.assertEqual(
            daily.exception.code,
            "422_invalid_report_date_range",
        )


if __name__ == "__main__":
    unittest.main()
