import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence.capacity import (
    CapacityMetricBuilder,
    CapacitySnapshot,
    build_capacity_metrics,
    calculate_capacity_utilization_percent,
    calculate_staff_load_percent,
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


class CapacitySnapshotTests(unittest.TestCase):
    def test_snapshot_normalizes_owner_id(self) -> None:
        snapshot = make_snapshot(owner_id="  tenant-a  ")

        self.assertEqual(snapshot.owner_id, "tenant-a")

    def test_snapshot_is_immutable(self) -> None:
        snapshot = make_snapshot()

        with self.assertRaises(AttributeError):
            snapshot.total_slots = 99  # type: ignore[misc]

    def test_snapshot_rejects_empty_owner(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "owner_id is required",
        ):
            make_snapshot(owner_id="   ")

    def test_snapshot_rejects_invalid_period(self) -> None:
        start = datetime(2026, 7, 1, tzinfo=UTC)

        with self.assertRaisesRegex(
            ValueError,
            "period_end must be later",
        ):
            make_snapshot(
                period_start=start,
                period_end=start,
            )

    def test_snapshot_rejects_negative_values(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "total_slots cannot be negative",
        ):
            make_snapshot(total_slots=-1)

    def test_snapshot_rejects_boolean_integer_values(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "booked_slots must be an integer",
        ):
            make_snapshot(booked_slots=True)


class CapacityCalculationTests(unittest.TestCase):
    def test_utilization_percent(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=30,
                total_slots=40,
            ),
            75.0,
        )

    def test_utilization_supports_overbooking(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=45,
                total_slots=40,
            ),
            112.5,
        )

    def test_zero_total_slots_returns_zero_utilization(self) -> None:
        self.assertEqual(
            calculate_capacity_utilization_percent(
                booked_slots=0,
                total_slots=0,
            ),
            0.0,
        )

    def test_staff_load_percent(self) -> None:
        self.assertEqual(
            calculate_staff_load_percent(
                booked_minutes=7_200,
                available_minutes=9_600,
            ),
            75.0,
        )

    def test_zero_available_minutes_returns_zero_load(self) -> None:
        self.assertEqual(
            calculate_staff_load_percent(
                booked_minutes=0,
                available_minutes=0,
            ),
            0.0,
        )


class CapacityMetricTests(unittest.TestCase):
    def test_builds_expected_metrics(self) -> None:
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

    def test_overbooking_never_creates_negative_available_slots(
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

    def test_overbooking_never_creates_negative_idle_hours(
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


class CapacityMetricBuilderTests(unittest.TestCase):
    def test_builder_reads_provider_once(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacityMetricBuilder(provider=provider)

        metrics = builder(
            IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(len(metrics), 5)

    def test_builder_rejects_owner_mismatch(self) -> None:
        provider = StaticCapacityProvider(
            make_snapshot(owner_id="tenant-b")
        )
        builder = CapacityMetricBuilder(provider=provider)

        with self.assertRaisesRegex(
            RuntimeError,
            "capacity snapshot owner does not match",
        ):
            builder(
                IntelligenceContext(owner_id="tenant-a")
            )

    def test_builder_rejects_invalid_context(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacityMetricBuilder(provider=provider)

        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            builder("tenant-a")  # type: ignore[arg-type]

    def test_builder_rejects_invalid_provider(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "provider must satisfy CapacityProvider",
        ):
            CapacityMetricBuilder(
                provider=object()  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
