import unittest
from datetime import UTC, datetime, timedelta

from app.intelligence.capacity import CapacitySnapshot
from app.intelligence.capacity_signals import (
    CAPACITY_HEALTHY_MAX_PERCENT,
    CAPACITY_IDLE_MAX_PERCENT,
    CAPACITY_NEAR_LIMIT_MAX_PERCENT,
    CAPACITY_UNDERUTILIZED_MAX_PERCENT,
    CapacitySignalBuilder,
    build_capacity_signal,
    build_capacity_signals,
    classify_capacity_utilization,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import SignalSeverity


def make_snapshot(
    *,
    owner_id: str = "tenant-a",
    total_slots: int = 100,
    booked_slots: int = 75,
) -> CapacitySnapshot:
    start = datetime(2026, 7, 1, tzinfo=UTC)

    return CapacitySnapshot(
        owner_id=owner_id,
        period_start=start,
        period_end=start + timedelta(days=7),
        total_slots=total_slots,
        booked_slots=booked_slots,
        completed_booking_count=booked_slots,
        active_staff_count=5,
        available_minutes=30_000,
        booked_minutes=22_500,
    )


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


class CapacityClassificationTests(unittest.IsolatedAsyncioTestCase):
    async def test_idle_classification(self) -> None:
        self.assertEqual(
            classify_capacity_utilization(
                CAPACITY_IDLE_MAX_PERCENT
            ),
            "capacity.idle",
        )

    async def test_underutilized_classification(self) -> None:
        self.assertEqual(
            classify_capacity_utilization(
                CAPACITY_UNDERUTILIZED_MAX_PERCENT
            ),
            "capacity.underutilized",
        )

    async def test_healthy_classification(self) -> None:
        self.assertEqual(
            classify_capacity_utilization(
                CAPACITY_HEALTHY_MAX_PERCENT
            ),
            "capacity.healthy",
        )

    async def test_near_limit_classification(self) -> None:
        self.assertEqual(
            classify_capacity_utilization(
                CAPACITY_NEAR_LIMIT_MAX_PERCENT
            ),
            "capacity.near_limit",
        )

    async def test_overloaded_classification(self) -> None:
        self.assertEqual(
            classify_capacity_utilization(100.01),
            "capacity.overloaded",
        )

    async def test_rejects_negative_utilization(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "cannot be negative",
        ):
            classify_capacity_utilization(-1)

    async def test_rejects_boolean_utilization(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "must be a number",
        ):
            classify_capacity_utilization(True)


class CapacitySignalTests(unittest.IsolatedAsyncioTestCase):
    async def test_builds_idle_signal(self) -> None:
        signal = build_capacity_signal(
            snapshot=make_snapshot(booked_slots=5)
        )

        self.assertEqual(signal.code, "capacity.idle")
        self.assertEqual(
            signal.severity,
            SignalSeverity.WARNING,
        )

    async def test_builds_underutilized_signal(self) -> None:
        signal = build_capacity_signal(
            snapshot=make_snapshot(booked_slots=35)
        )

        self.assertEqual(
            signal.code,
            "capacity.underutilized",
        )
        self.assertEqual(
            signal.severity,
            SignalSeverity.OPPORTUNITY,
        )

    async def test_builds_healthy_signal(self) -> None:
        signal = build_capacity_signal(
            snapshot=make_snapshot(booked_slots=70)
        )

        self.assertEqual(
            signal.code,
            "capacity.healthy",
        )
        self.assertEqual(
            signal.severity,
            SignalSeverity.INFO,
        )

    async def test_builds_near_limit_signal(self) -> None:
        signal = build_capacity_signal(
            snapshot=make_snapshot(booked_slots=95)
        )

        self.assertEqual(
            signal.code,
            "capacity.near_limit",
        )
        self.assertEqual(
            signal.severity,
            SignalSeverity.WARNING,
        )

    async def test_builds_overloaded_signal(self) -> None:
        signal = build_capacity_signal(
            snapshot=make_snapshot(booked_slots=110)
        )

        self.assertEqual(
            signal.code,
            "capacity.overloaded",
        )
        self.assertEqual(
            signal.severity,
            SignalSeverity.CRITICAL,
        )

    async def test_signal_contains_snapshot_evidence(self) -> None:
        snapshot = make_snapshot(booked_slots=75)
        signal = build_capacity_signal(snapshot=snapshot)

        self.assertEqual(len(signal.evidence), 1)
        self.assertEqual(
            signal.evidence[0].source,
            "capacity.snapshot",
        )
        self.assertEqual(
            signal.evidence[0].observed_at,
            snapshot.period_end,
        )
        self.assertEqual(
            signal.evidence[0].value[
                "active_staff_count"
            ],
            5,
        )

    async def test_collection_is_tuple(self) -> None:
        signals = build_capacity_signals(
            snapshot=make_snapshot()
        )

        self.assertIsInstance(signals, tuple)
        self.assertEqual(len(signals), 1)

    async def test_rejects_invalid_snapshot(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "snapshot must be a CapacitySnapshot",
        ):
            build_capacity_signal(
                snapshot=object()  # type: ignore[arg-type]
            )


class CapacitySignalBuilderTests(unittest.IsolatedAsyncioTestCase):
    async def test_builder_reads_provider_once(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacitySignalBuilder(provider=provider)

        signals = await builder(
            IntelligenceContext(owner_id="tenant-a")
        )

        self.assertEqual(provider.calls, 1)
        self.assertEqual(len(signals), 1)

    async def test_builder_rejects_owner_mismatch(self) -> None:
        provider = StaticCapacityProvider(
            make_snapshot(owner_id="tenant-b")
        )
        builder = CapacitySignalBuilder(provider=provider)

        with self.assertRaisesRegex(
            RuntimeError,
            "capacity snapshot owner does not match",
        ):
            await builder(
                IntelligenceContext(owner_id="tenant-a")
            )

    async def test_builder_rejects_invalid_context(self) -> None:
        provider = StaticCapacityProvider(make_snapshot())
        builder = CapacitySignalBuilder(provider=provider)

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
            CapacitySignalBuilder(
                provider=object()  # type: ignore[arg-type]
            )


if __name__ == "__main__":
    unittest.main()
