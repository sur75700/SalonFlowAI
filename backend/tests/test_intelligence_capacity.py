import unittest
from collections.abc import Awaitable
from datetime import UTC, datetime, timedelta
from typing import get_args, get_origin, get_type_hints

from app.intelligence.capacity import (
    CAPACITY_BASELINE_METADATA_KEY,
    CapacityBaseline,
    CapacityDataUnavailable,
    CapacityMetricBuilder,
    CapacityProvider,
    CapacitySnapshot,
    build_capacity_metrics,
    calculate_capacity_utilization_percent,
    calculate_staff_load_percent,
    require_capacity_baseline,
)
from app.intelligence.context import IntelligenceContext


class StaticCapacityProvider:
    def __init__(self, snapshot: CapacitySnapshot) -> None:
        self.snapshot = snapshot
        self.calls = 0

    def get_capacity_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacitySnapshot:
        self.calls += 1
        return self.snapshot


def make_snapshot(
    **overrides: object,
) -> CapacitySnapshot:
    start = datetime(2026, 7, 1, tzinfo=UTC)

    values: dict[str, object] = {
        "owner_id": "tenant-a",
        "period_start": start,
        "period_end": start + timedelta(days=7),
        "total_slots": 40,
        "booked_slots": 30,
        "completed_booking_count": 24,
        "active_staff_count": 4,
        "available_minutes": 9_600,
        "booked_minutes": 7_200,
    }
    values.update(overrides)

    return CapacitySnapshot(**values)  # type: ignore[arg-type]



class CapacityBaselineTests(unittest.TestCase):
    def make_baseline(
        self,
        **overrides: object,
    ) -> CapacityBaseline:
        period_start = datetime(
            2026,
            7,
            1,
            tzinfo=UTC,
        )

        values: dict[str, object] = {
            "owner_id": "tenant-a",
            "period_start": period_start,
            "period_end": (
                period_start + timedelta(days=7)
            ),
            "total_slots": 40,
            "active_staff_count": 4,
            "available_minutes": 9_600,
            "source": "staff_schedule",
        }
        values.update(overrides)

        return CapacityBaseline(
            **values  # type: ignore[arg-type]
        )

    def test_baseline_normalizes_identity_and_source(
        self,
    ) -> None:
        baseline = self.make_baseline(
            owner_id="  tenant-a  ",
            source="  staff_schedule  ",
        )

        self.assertEqual(
            baseline.owner_id,
            "tenant-a",
        )
        self.assertEqual(
            baseline.source,
            "staff_schedule",
        )

    def test_baseline_is_immutable(self) -> None:
        baseline = self.make_baseline()

        with self.assertRaises(AttributeError):
            baseline.total_slots = 10  # type: ignore[misc]

    def test_baseline_rejects_empty_source(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "source is required",
        ):
            self.make_baseline(source="   ")

    def test_baseline_normalizes_naive_period_to_utc(
        self,
    ) -> None:
        baseline = self.make_baseline(
            period_start=datetime(2026, 7, 1),
            period_end=datetime(2026, 7, 8),
        )

        self.assertEqual(
            baseline.period_start.tzinfo,
            UTC,
        )
        self.assertEqual(
            baseline.period_end.tzinfo,
            UTC,
        )

    def test_baseline_rejects_invalid_period(
        self,
    ) -> None:
        instant = datetime(
            2026,
            7,
            1,
            tzinfo=UTC,
        )

        with self.assertRaisesRegex(
            ValueError,
            "period_end must be later",
        ):
            self.make_baseline(
                period_start=instant,
                period_end=instant,
            )

    def test_baseline_rejects_negative_values(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "available_minutes cannot be negative",
        ):
            self.make_baseline(
                available_minutes=-1
            )

    def test_baseline_rejects_boolean_values(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "total_slots must be an integer",
        ):
            self.make_baseline(
                total_slots=True
            )

    def test_context_resolves_trusted_baseline(
        self,
    ) -> None:
        baseline = self.make_baseline()

        context = IntelligenceContext(
            owner_id="tenant-a",
            metadata={
                CAPACITY_BASELINE_METADATA_KEY: (
                    baseline
                )
            },
        )

        self.assertIs(
            require_capacity_baseline(context),
            baseline,
        )

    def test_missing_baseline_fails_closed(
        self,
    ) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a"
        )

        with self.assertRaisesRegex(
            CapacityDataUnavailable,
            "trusted capacity baseline is unavailable",
        ):
            require_capacity_baseline(context)

    def test_cross_tenant_baseline_is_rejected(
        self,
    ) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a",
            metadata={
                CAPACITY_BASELINE_METADATA_KEY: (
                    self.make_baseline(
                        owner_id="tenant-b"
                    )
                )
            },
        )

        with self.assertRaisesRegex(
            RuntimeError,
            "baseline owner does not match",
        ):
            require_capacity_baseline(context)

    def test_provider_contract_supports_async_results(
        self,
    ) -> None:
        return_type = get_type_hints(
            CapacityProvider.get_capacity_snapshot
        )["return"]

        members = get_args(return_type)

        self.assertIn(
            CapacitySnapshot,
            members,
        )

        awaitables = tuple(
            member
            for member in members
            if get_origin(member) is Awaitable
        )

        self.assertEqual(len(awaitables), 1)
        self.assertEqual(
            get_args(awaitables[0]),
            (CapacitySnapshot,),
        )


class CapacitySnapshotTests(unittest.IsolatedAsyncioTestCase):
    async def test_snapshot_normalizes_owner_id(self) -> None:
        snapshot = make_snapshot(owner_id="  tenant-a  ")

        self.assertEqual(snapshot.owner_id, "tenant-a")

    async def test_snapshot_is_immutable(self) -> None:
        snapshot = make_snapshot()

        with self.assertRaises(AttributeError):
            snapshot.total_slots = 99  # type: ignore[misc]

    async def test_snapshot_rejects_empty_owner(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "owner_id is required",
        ):
            make_snapshot(owner_id="   ")

    async def test_snapshot_rejects_invalid_period(self) -> None:
        start = datetime(2026, 7, 1, tzinfo=UTC)

        with self.assertRaisesRegex(
            ValueError,
            "period_end must be later",
        ):
            make_snapshot(
                period_start=start,
                period_end=start,
            )

    async def test_snapshot_rejects_negative_values(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "total_slots cannot be negative",
        ):
            make_snapshot(total_slots=-1)

    async def test_snapshot_rejects_boolean_integer_values(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "booked_slots must be an integer",
        ):
            make_snapshot(booked_slots=True)


class CapacityCalculationTests(unittest.IsolatedAsyncioTestCase):
    async def test_utilization_percent(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=30,
                total_slots=40,
            ),
            75.0,
        )

    async def test_utilization_supports_overbooking(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=45,
                total_slots=40,
            ),
            112.5,
        )

    async def test_zero_total_slots_returns_zero_utilization(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=0,
                total_slots=0,
            ),
            0.0,
        )

    async def test_staff_load_percent(self) -> None:
        self.assertEqual(
            calculate_staff_load_percent(
                booked_minutes=7_200,
                available_minutes=9_600,
            ),
            75.0,
        )

    async def test_zero_available_minutes_returns_zero_load(self) -> None:
        self.assertEqual(
            calculate_staff_load_percent(
                booked_minutes=0,
                available_minutes=0,
            ),
            0.0,
        )


class CapacityMetricTests(unittest.IsolatedAsyncioTestCase):
    async def test_builds_expected_metrics(self) -> None:
        metrics = build_capacity_metrics(
            snapshot=make_snapshot()
        )

        self.assertIsInstance(metrics, tuple)
        self.assertEqual(len(metrics), 5)

        metrics_by_key = {
            metric.key: metric
            for metric in metrics
        }

        self.assertEqual(
            metrics_by_key[
                "capacity.utilization_percent"
            ].value,
            75.0,
        )
        self.assertEqual(
            metrics_by_key[
                "capacity.available_slots"
            ].value,
            10,
        )
        self.assertEqual(
            metrics_by_key[
                "capacity.completed_bookings"
            ].value,
            24,
        )
        self.assertEqual(
            metrics_by_key[
                "capacity.staff_load_percent"
            ].value,
            75.0,
        )
        self.assertEqual(
            metrics_by_key[
                "capacity.idle_hours"
            ].value,
            40.0,
        )

    async def test_overbooking_never_creates_negative_available_slots(
        self,
    ) -> None:
        metrics = build_capacity_metrics(
            snapshot=make_snapshot(
                total_slots=40,
                booked_slots=45,
            )
        )

        available_slots = next(
            metric
            for metric in metrics
            if metric.key == "capacity.available_slots"
        )

        self.assertEqual(available_slots.value, 0)

    async def test_overbooking_never_creates_negative_idle_hours(
        self,
    ) -> None:
        metrics = build_capacity_metrics(
            snapshot=make_snapshot(
                available_minutes=9_600,
                booked_minutes=10_200,
            )
        )

        idle_hours = next(
            metric
            for metric in metrics
            if metric.key == "capacity.idle_hours"
        )

        self.assertEqual(idle_hours.value, 0.0)


class CapacityMetricBuilderTests(unittest.IsolatedAsyncioTestCase):
    async def test_builder_reads_provider_once(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacityMetricBuilder(provider=provider)

        metrics = await builder(
            IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(len(metrics), 5)

    async def test_builder_rejects_owner_mismatch(self) -> None:
        provider = StaticCapacityProvider(
            make_snapshot(owner_id="tenant-b")
        )
        builder = CapacityMetricBuilder(provider=provider)

        with self.assertRaisesRegex(
            RuntimeError,
            "capacity snapshot owner does not match",
        ):
            await builder(
                IntelligenceContext(owner_id="tenant-a")
            )

    async def test_builder_rejects_invalid_context(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacityMetricBuilder(provider=provider)

        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            await builder("tenant-a")  # type: ignore[arg-type]

    async def test_builder_rejects_invalid_provider(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "provider must satisfy CapacityProvider",
        ):
            CapacityMetricBuilder(
                provider=object()  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
