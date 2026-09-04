from __future__ import annotations

import inspect
import math
import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app.analytics import revenue_time_series as rts
from app.api.analytics import analytics_revenue_time_series
from app.main import app


OWNER_A = "64b64c000000000000000001"


class FakeProfileCollection:
    def __init__(self, profile):
        self.profile = profile
        self.query = None

    async def find_one(self, query):
        self.query = query
        return self.profile


class FakeAggregateCursor:
    def __init__(self, rows):
        self.rows = list(rows)
        self.length = None

    async def to_list(self, *, length):
        self.length = length
        return self.rows[:length]


class FakeAppointments:
    def __init__(self, rows=None):
        self.rows = list(rows or [])
        self.pipelines = []
        self.cursor = None

    def aggregate(self, pipeline):
        self.pipelines.append(pipeline)

        self.cursor = FakeAggregateCursor(
            self.rows
        )

        return self.cursor


class FakeDatabase:
    def __init__(
        self,
        *,
        profile=None,
        rows=None,
    ):
        self.salon_capacity_profiles = (
            FakeProfileCollection(
                profile
            )
        )

        self.appointments = FakeAppointments(
            rows
        )


class RevenueTimeSeriesPureContractTests(
    unittest.TestCase
):
    def test_supported_public_presets_are_frozen(
        self,
    ):
        self.assertEqual(
            rts.SUPPORTED_PRESETS,
            frozenset(
                {
                    "24h",
                    "7d",
                    "30d",
                    "90d",
                    "ytd",
                    "1y",
                    "all",
                    "custom",
                }
            ),
        )

    def test_currency_contract_is_isolated(
        self,
    ):
        self.assertEqual(
            rts.SUPPORTED_CURRENCIES,
            frozenset(
                {
                    "AMD",
                    "USD",
                    "EUR",
                    "RUB",
                }
            ),
        )

        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ):
            rts._normalize_currency(
                "BTC"
            )

    def test_invalid_preset_fails_closed(
        self,
    ):
        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ):
            rts._resolve_range(
                preset="forever",
                timezone=rts.ZoneInfo(
                    "UTC"
                ),
                now_utc=datetime(
                    2026,
                    9,
                    4,
                    tzinfo=UTC,
                ),
                earliest_trusted=None,
                date_from=None,
                date_to=None,
            )

    def test_adaptive_granularity_never_exceeds_bound(
        self,
    ):
        start = datetime(
            1900,
            1,
            1,
            tzinfo=UTC,
        )

        end = datetime(
            2100,
            1,
            1,
            tzinfo=UTC,
        )

        unit, bin_size = (
            rts._select_granularity(
                start,
                end,
            )
        )

        self.assertEqual(
            unit,
            "quarter",
        )

        self.assertGreaterEqual(
            bin_size,
            1,
        )

        quarter_count = math.ceil(
            (
                (end - start).days
                / 91.3125
            )
            / bin_size
        )

        self.assertLessEqual(
            quarter_count,
            rts.MAX_RENDER_BUCKETS,
        )

    def test_custom_reversed_range_fails_closed(
        self,
    ):
        timezone = rts.ZoneInfo(
            "Asia/Yerevan"
        )

        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ):
            rts._resolve_range(
                preset="custom",
                timezone=timezone,
                now_utc=datetime(
                    2026,
                    9,
                    4,
                    tzinfo=UTC,
                ),
                earliest_trusted=None,
                date_from="2026-09-10",
                date_to="2026-09-01",
            )

    def test_custom_requires_both_bounds(
        self,
    ):
        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ):
            rts._resolve_range(
                preset="custom",
                timezone=rts.ZoneInfo(
                    "UTC"
                ),
                now_utc=datetime(
                    2026,
                    9,
                    4,
                    tzinfo=UTC,
                ),
                earliest_trusted=None,
                date_from="2026-09-01",
                date_to=None,
            )

    def test_date_only_custom_end_is_inclusive_calendar_day(
        self,
    ):
        timezone = rts.ZoneInfo(
            "Asia/Yerevan"
        )

        result = rts._resolve_range(
            preset="custom",
            timezone=timezone,
            now_utc=datetime(
                2026,
                9,
                4,
                tzinfo=UTC,
            ),
            earliest_trusted=None,
            date_from="2026-09-01",
            date_to="2026-09-03",
        )

        self.assertEqual(
            result.start_local
            .date()
            .isoformat(),
            "2026-09-01",
        )

        self.assertEqual(
            result.end_local
            .date()
            .isoformat(),
            "2026-09-04",
        )

    def test_non_custom_rejects_custom_bounds(
        self,
    ):
        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ):
            rts._resolve_range(
                preset="30d",
                timezone=rts.ZoneInfo(
                    "UTC"
                ),
                now_utc=datetime(
                    2026,
                    9,
                    4,
                    tzinfo=UTC,
                ),
                earliest_trusted=None,
                date_from="2026-09-01",
                date_to="2026-09-03",
            )

    def test_pipeline_enforces_owner_completed_currency_and_server_grouping(
        self,
    ):
        pipeline = rts._series_pipeline(
            owner_id="tenant-a",
            currency="USD",
            timezone_name="Asia/Yerevan",
            query_start=datetime(
                2026,
                1,
                1,
                tzinfo=UTC,
            ),
            current_start=datetime(
                2026,
                2,
                1,
                tzinfo=UTC,
            ),
            current_end=datetime(
                2026,
                3,
                1,
                tzinfo=UTC,
            ),
            granularity="day",
            bin_size=1,
            compare=True,
        )

        first_match = (
            pipeline[0]["$match"]
        )

        self.assertEqual(
            first_match["owner_id"],
            "tenant-a",
        )

        self.assertEqual(
            first_match["status"],
            "completed",
        )

        self.assertEqual(
            first_match[
                "currency_snapshot"
            ],
            "USD",
        )

        rendered = repr(pipeline)

        self.assertIn(
            "price_snapshot",
            rendered,
        )

        self.assertIn(
            "$dateTrunc",
            rendered,
        )

        self.assertIn(
            "$group",
            rendered,
        )

        self.assertNotIn(
            "2000",
            rendered,
        )

        self.assertNotIn(
            "5000",
            rendered,
        )

    def test_earliest_pipeline_is_owner_currency_and_completed_scoped(
        self,
    ):
        pipeline = (
            rts._earliest_pipeline(
                owner_id="tenant-a",
                currency="EUR",
            )
        )

        match = pipeline[0]["$match"]

        self.assertEqual(
            match,
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "currency_snapshot": "EUR",
            },
        )

        self.assertIn(
            {"$limit": 1},
            pipeline,
        )

    def test_domain_has_no_legacy_raw_history_limit(
        self,
    ):
        source = inspect.getsource(
            rts
        )

        self.assertNotIn(
            "to_list(length=5000)",
            source,
        )

        self.assertNotIn(
            "to_list(length=2000)",
            source,
        )

        self.assertIn(
            ".aggregate(",
            source,
        )

    def test_previous_zero_never_emits_nan_or_infinity(
        self,
    ):
        summary = rts._summary(
            current_series=[
                {
                    "value": 100,
                    "completed_count": 1,
                }
            ],
            comparison_series=[],
            compare=True,
        )

        self.assertIsNone(
            summary["delta_percent"]
        )

        for value in (
            summary[
                "completed_revenue"
            ],
            summary["delta"],
        ):
            self.assertTrue(
                math.isfinite(
                    float(value)
                )
            )


class RevenueTimeSeriesTimezoneTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_active_capacity_profile_timezone_is_authoritative(
        self,
    ):
        db = FakeDatabase(
            profile={
                "owner_id": OWNER_A,
                "status": "active",
                "timezone": "Asia/Yerevan",
            }
        )

        (
            name,
            source,
            warnings,
        ) = await rts._resolve_timezone(
            database=db,
            owner_id=OWNER_A,
        )

        self.assertEqual(
            name,
            "Asia/Yerevan",
        )

        self.assertEqual(
            source,
            "capacity_profile",
        )

        self.assertEqual(
            warnings,
            (),
        )

        self.assertEqual(
            db.salon_capacity_profiles.query,
            {
                "owner_id": OWNER_A,
                "status": "active",
            },
        )

    async def test_missing_timezone_falls_back_explicitly(
        self,
    ):
        db = FakeDatabase(
            profile=None
        )

        (
            name,
            source,
            warnings,
        ) = await rts._resolve_timezone(
            database=db,
            owner_id=OWNER_A,
        )

        self.assertEqual(
            name,
            "UTC",
        )

        self.assertEqual(
            source,
            "utc_fallback",
        )

        self.assertEqual(
            warnings,
            (
                "timezone_fallback_utc",
            ),
        )

    async def test_invalid_timezone_falls_back_explicitly(
        self,
    ):
        db = FakeDatabase(
            profile={
                "timezone": "Not/AZone"
            }
        )

        (
            name,
            source,
            warnings,
        ) = await rts._resolve_timezone(
            database=db,
            owner_id=OWNER_A,
        )

        self.assertEqual(
            name,
            "UTC",
        )

        self.assertEqual(
            source,
            "utc_fallback",
        )

        self.assertEqual(
            warnings,
            (
                "timezone_fallback_utc",
            ),
        )


class RevenueTimeSeriesBuilderTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_builder_calculates_trusted_current_and_comparison_summary(
        self,
    ):
        db = FakeDatabase()

        rows = [
            {
                "period": "comparison",
                "bucket_start": datetime(
                    2026,
                    8,
                    4,
                    tzinfo=UTC,
                ),
                "bucket_end": datetime(
                    2026,
                    8,
                    5,
                    tzinfo=UTC,
                ),
                "value": 5000,
                "completed_count": 1,
            },
            {
                "period": "current",
                "bucket_start": datetime(
                    2026,
                    9,
                    3,
                    tzinfo=UTC,
                ),
                "bucket_end": datetime(
                    2026,
                    9,
                    4,
                    tzinfo=UTC,
                ),
                "value": 10000,
                "completed_count": 2,
            },
        ]

        with (
            patch(
                "app.analytics."
                "revenue_time_series."
                "get_database",
                return_value=db,
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_resolve_timezone",
                new=AsyncMock(
                    return_value=(
                        "UTC",
                        "capacity_profile",
                        (),
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_find_earliest_trusted",
                new=AsyncMock(
                    return_value=datetime(
                        2025,
                        1,
                        1,
                        tzinfo=UTC,
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_aggregate_rows",
                new=AsyncMock(
                    return_value=rows
                ),
            ),
        ):
            result = (
                await rts.build_revenue_time_series(
                    owner_id=OWNER_A,
                    preset="30d",
                    currency="AMD",
                    compare=True,
                    now=datetime(
                        2026,
                        9,
                        4,
                        tzinfo=UTC,
                    ),
                )
            )

        self.assertEqual(
            result["summary"][
                "completed_revenue"
            ],
            10000.0,
        )

        self.assertEqual(
            result["summary"][
                "previous_completed_revenue"
            ],
            5000.0,
        )

        self.assertEqual(
            result["summary"]["delta"],
            5000.0,
        )

        self.assertEqual(
            result["summary"][
                "delta_percent"
            ],
            100.0,
        )

        self.assertEqual(
            result["summary"][
                "completed_count"
            ],
            2,
        )

    async def test_more_than_5000_completed_bookings_are_representable_after_server_aggregation(
        self,
    ):
        db = FakeDatabase()

        rows = [
            {
                "period": "current",
                "bucket_start": datetime(
                    2026,
                    1,
                    1,
                    tzinfo=UTC,
                ),
                "bucket_end": datetime(
                    2026,
                    2,
                    1,
                    tzinfo=UTC,
                ),
                "value": 6001000,
                "completed_count": 6001,
            }
        ]

        with (
            patch(
                "app.analytics."
                "revenue_time_series."
                "get_database",
                return_value=db,
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_resolve_timezone",
                new=AsyncMock(
                    return_value=(
                        "UTC",
                        "capacity_profile",
                        (),
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_find_earliest_trusted",
                new=AsyncMock(
                    return_value=datetime(
                        2020,
                        1,
                        1,
                        tzinfo=UTC,
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_aggregate_rows",
                new=AsyncMock(
                    return_value=rows
                ),
            ),
        ):
            result = (
                await rts.build_revenue_time_series(
                    owner_id=OWNER_A,
                    preset="all",
                    currency="AMD",
                    compare=False,
                    now=datetime(
                        2026,
                        9,
                        4,
                        tzinfo=UTC,
                    ),
                )
            )

        self.assertEqual(
            result["summary"][
                "completed_count"
            ],
            6001,
        )

    async def test_all_with_no_trusted_history_is_valid_empty(
        self,
    ):
        db = FakeDatabase()

        with (
            patch(
                "app.analytics."
                "revenue_time_series."
                "get_database",
                return_value=db,
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_resolve_timezone",
                new=AsyncMock(
                    return_value=(
                        "UTC",
                        "utc_fallback",
                        (
                            "timezone_fallback_utc",
                        ),
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_find_earliest_trusted",
                new=AsyncMock(
                    return_value=None
                ),
            ),
        ):
            result = (
                await rts.build_revenue_time_series(
                    owner_id=OWNER_A,
                    preset="all",
                    currency="AMD",
                    now=datetime(
                        2026,
                        9,
                        4,
                        tzinfo=UTC,
                    ),
                )
            )

        self.assertEqual(
            result["series"],
            [],
        )

        self.assertEqual(
            result[
                "comparison_series"
            ],
            [],
        )

        self.assertIsNone(
            result[
                "earliest_trusted_at"
            ]
        )

        self.assertIn(
            "timezone_fallback_utc",
            result["warnings"],
        )

    async def test_future_only_custom_range_is_valid_empty_and_does_not_query_aggregation(
        self,
    ):
        db = FakeDatabase()

        aggregate = AsyncMock(
            return_value=[
                {
                    "period": "current",
                    "bucket_start": datetime(
                        2030,
                        1,
                        1,
                        tzinfo=UTC,
                    ),
                    "bucket_end": datetime(
                        2030,
                        1,
                        2,
                        tzinfo=UTC,
                    ),
                    "value": 999999,
                    "completed_count": 1,
                }
            ]
        )

        with (
            patch(
                "app.analytics."
                "revenue_time_series."
                "get_database",
                return_value=db,
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_resolve_timezone",
                new=AsyncMock(
                    return_value=(
                        "UTC",
                        "capacity_profile",
                        (),
                    )
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_find_earliest_trusted",
                new=AsyncMock(
                    return_value=None
                ),
            ),
            patch(
                "app.analytics."
                "revenue_time_series."
                "_aggregate_rows",
                new=aggregate,
            ),
        ):
            result = (
                await rts.build_revenue_time_series(
                    owner_id=OWNER_A,
                    preset="custom",
                    date_from="2030-01-01",
                    date_to="2030-01-02",
                    currency="AMD",
                    compare=True,
                    now=datetime(
                        2026,
                        9,
                        4,
                        tzinfo=UTC,
                    ),
                )
            )

        aggregate.assert_not_awaited()

        self.assertEqual(
            result["series"],
            [],
        )

        self.assertEqual(
            result[
                "comparison_series"
            ],
            [],
        )


class RevenueTimeSeriesOverflowTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_aggregate_bucket_overflow_fails_closed(
        self,
    ):
        rows = [
            {
                "period": "current",
            }
            for _ in range(
                rts.MAX_AGGREGATE_ROWS
                + 1
            )
        ]

        db = FakeDatabase(
            rows=rows
        )

        resolved = rts.ResolvedRange(
            start_local=datetime(
                2026,
                1,
                1,
                tzinfo=UTC,
            ),
            end_local=datetime(
                2026,
                2,
                1,
                tzinfo=UTC,
            ),
            start_utc=datetime(
                2026,
                1,
                1,
                tzinfo=UTC,
            ),
            end_utc=datetime(
                2026,
                2,
                1,
                tzinfo=UTC,
            ),
            previous_start_local=datetime(
                2025,
                12,
                1,
                tzinfo=UTC,
            ),
            previous_start_utc=datetime(
                2025,
                12,
                1,
                tzinfo=UTC,
            ),
        )

        with self.assertRaises(
            rts.RevenueTimeSeriesError
        ) as caught:
            await rts._aggregate_rows(
                database=db,
                owner_id=OWNER_A,
                currency="AMD",
                timezone_name="UTC",
                resolved_range=resolved,
                granularity="day",
                bin_size=1,
                compare=True,
            )

        self.assertEqual(
            caught.exception.status_code,
            500,
        )


class RevenueTimeSeriesApiTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_invalid_server_auth_fails_closed(
        self,
    ):
        with self.assertRaises(
            HTTPException
        ) as caught:
            await analytics_revenue_time_series(
                auth={}
            )

        self.assertEqual(
            caught.exception.status_code,
            401,
        )

    async def test_owner_identity_comes_only_from_auth_context(
        self,
    ):
        payload = {
            "contract_version": "1",
            "series": [],
        }

        builder = AsyncMock(
            return_value=payload
        )

        with patch(
            "app.api.analytics."
            "build_revenue_time_series",
            new=builder,
        ):
            result = (
                await analytics_revenue_time_series(
                    preset="30d",
                    date_from=None,
                    date_to=None,
                    currency="AMD",
                    compare=True,
                    auth={
                        "admin_id": OWNER_A
                    },
                )
            )

        self.assertEqual(
            result,
            payload,
        )

        self.assertEqual(
            builder.await_args.kwargs[
                "owner_id"
            ],
            OWNER_A,
        )

    async def test_domain_error_maps_to_http_error(
        self,
    ):
        builder = AsyncMock(
            side_effect=rts.RevenueTimeSeriesError(
                "422_invalid_revenue_time_series_currency",
                422,
            )
        )

        with patch(
            "app.api.analytics."
            "build_revenue_time_series",
            new=builder,
        ):
            with self.assertRaises(
                HTTPException
            ) as caught:
                await analytics_revenue_time_series(
                    preset="30d",
                    currency="BTC",
                    auth={
                        "admin_id": OWNER_A
                    },
                )

        self.assertEqual(
            caught.exception.status_code,
            422,
        )

        self.assertEqual(
            caught.exception.detail,
            "422_invalid_revenue_time_series_currency",
        )

    def test_openapi_exposes_route_without_owner_id_parameter(
        self,
    ):
        # Ensure a stale OpenAPI cache cannot hide the new route.
        app.openapi_schema = None

        schema = app.openapi()

        operation = schema["paths"][
            "/analytics/revenue/time-series"
        ]["get"]

        parameter_names = {
            item["name"]
            for item in operation.get(
                "parameters",
                [],
            )
        }

        self.assertIn(
            "preset",
            parameter_names,
        )

        self.assertIn(
            "currency",
            parameter_names,
        )

        self.assertIn(
            "compare",
            parameter_names,
        )

        self.assertNotIn(
            "owner_id",
            parameter_names,
        )


class RevenueTimeSeriesHardeningTests(
    unittest.TestCase
):
    def test_mongo_financial_aggregation_uses_decimal_not_double(
        self,
    ):
        pipeline = rts._series_pipeline(
            owner_id="tenant-a",
            currency="USD",
            timezone_name="UTC",
            query_start=datetime(
                2026,
                1,
                1,
                tzinfo=UTC,
            ),
            current_start=datetime(
                2026,
                2,
                1,
                tzinfo=UTC,
            ),
            current_end=datetime(
                2026,
                3,
                1,
                tzinfo=UTC,
            ),
            granularity="day",
            bin_size=1,
            compare=True,
        )

        rendered = repr(pipeline)

        self.assertIn(
            "'to': 'decimal'",
            rendered,
        )

        self.assertNotIn(
            "'to': 'double'",
            rendered,
        )

        self.assertIn(
            "'$sum': '$_rts_price'",
            rendered,
        )

    def test_initial_match_is_directly_indexable_by_canonical_time_range(
        self,
    ):
        start = datetime(
            2026,
            1,
            1,
            tzinfo=UTC,
        )

        end = datetime(
            2026,
            2,
            1,
            tzinfo=UTC,
        )

        pipeline = rts._series_pipeline(
            owner_id="tenant-a",
            currency="EUR",
            timezone_name="UTC",
            query_start=start,
            current_start=start,
            current_end=end,
            granularity="day",
            bin_size=1,
            compare=False,
        )

        first = pipeline[0][
            "$match"
        ]

        self.assertEqual(
            first["owner_id"],
            "tenant-a",
        )

        self.assertEqual(
            first["status"],
            "completed",
        )

        self.assertEqual(
            first["currency_snapshot"],
            "EUR",
        )

        self.assertEqual(
            first["starts_at"],
            {
                "$gte": start.isoformat(),
                "$lt": end.isoformat(),
            },
        )

    def test_currency_rounding_respects_amd_and_fractional_currency_scale(
        self,
    ):
        self.assertEqual(
            rts._round_money(
                "100.5",
                currency="AMD",
            ),
            101.0,
        )

        self.assertEqual(
            rts._round_money(
                "12.345",
                currency="USD",
            ),
            12.35,
        )

        self.assertEqual(
            rts._round_money(
                "12.344",
                currency="EUR",
            ),
            12.34,
        )

    def test_dst_spring_forward_owner_local_day_is_23_utc_hours(
        self,
    ):
        timezone = rts.ZoneInfo(
            "America/New_York"
        )

        resolved = rts._resolve_range(
            preset="custom",
            timezone=timezone,
            now_utc=datetime(
                2026,
                3,
                20,
                tzinfo=UTC,
            ),
            earliest_trusted=None,
            date_from="2026-03-08",
            date_to="2026-03-08",
        )

        self.assertEqual(
            resolved.start_utc,
            datetime(
                2026,
                3,
                8,
                5,
                0,
                tzinfo=UTC,
            ),
        )

        self.assertEqual(
            resolved.end_utc,
            datetime(
                2026,
                3,
                9,
                4,
                0,
                tzinfo=UTC,
            ),
        )

        self.assertEqual(
            (
                resolved.end_utc
                - resolved.start_utc
            ).total_seconds(),
            23 * 60 * 60,
        )

    def test_dst_fall_back_owner_local_day_is_25_utc_hours(
        self,
    ):
        timezone = rts.ZoneInfo(
            "America/New_York"
        )

        resolved = rts._resolve_range(
            preset="custom",
            timezone=timezone,
            now_utc=datetime(
                2026,
                11,
                10,
                tzinfo=UTC,
            ),
            earliest_trusted=None,
            date_from="2026-11-01",
            date_to="2026-11-01",
        )

        self.assertEqual(
            (
                resolved.end_utc
                - resolved.start_utc
            ).total_seconds(),
            25 * 60 * 60,
        )

    def test_earliest_pipeline_is_sorted_by_indexed_raw_start_before_conversion(
        self,
    ):
        pipeline = (
            rts._earliest_pipeline(
                owner_id="tenant-a",
                currency="RUB",
            )
        )

        self.assertEqual(
            pipeline[0]["$match"],
            {
                "owner_id": "tenant-a",
                "status": "completed",
                "currency_snapshot": "RUB",
            },
        )

        self.assertEqual(
            pipeline[1],
            {
                "$sort": {
                    "starts_at": 1,
                }
            },
        )


class RevenueTimeSeriesOpenApiHardeningTests(
    unittest.TestCase
):
    def test_public_200_response_has_strong_schema(
        self,
    ):
        app.openapi_schema = None

        schema = app.openapi()

        operation = schema["paths"][
            "/analytics/revenue/time-series"
        ]["get"]

        response_schema = (
            operation["responses"]["200"]
            ["content"]["application/json"]
            ["schema"]
        )

        self.assertTrue(
            "$ref" in response_schema
            or bool(
                response_schema.get(
                    "properties"
                )
            )
        )

        rendered = repr(
            response_schema
        )

        self.assertIn(
            "RevenueTimeSeriesResponse",
            rendered,
        )

    def test_response_model_schema_contains_required_contract_fields(
        self,
    ):
        app.openapi_schema = None

        schema = app.openapi()

        model = schema[
            "components"
        ]["schemas"][
            "RevenueTimeSeriesResponse"
        ]

        properties = set(
            model["properties"]
        )

        self.assertTrue(
            {
                "contract_version",
                "preset",
                "currency",
                "timezone",
                "timezone_source",
                "range",
                "granularity",
                "earliest_trusted_at",
                "summary",
                "series",
                "comparison_series",
                "warnings",
            }.issubset(
                properties
            )
        )


if __name__ == "__main__":
    unittest.main()
