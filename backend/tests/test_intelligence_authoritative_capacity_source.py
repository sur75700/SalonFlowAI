import unittest
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.capacity.resolver import (
    AuthoritativeCapacityResult,
    CapacityConfigurationUnavailable,
)
from app.intelligence.authoritative_capacity_source import (
    AUTHORITATIVE_CAPACITY_SOURCE,
    AuthoritativeCapacitySource,
)
from app.intelligence.capacity import CapacityDataUnavailable
from app.intelligence.capacity_baseline_source import (
    CapacityBaselineSource,
)
from app.intelligence.context import IntelligenceContext


START = datetime(2026, 7, 1, tzinfo=UTC)
END = START + timedelta(days=1)


def make_result(owner_id="tenant-a"):
    return AuthoritativeCapacityResult(
        owner_id=owner_id,
        period_start=START,
        period_end=END,
        slot_duration_minutes=30,
        active_staff_count=2,
        available_minutes=960,
        total_slots=32,
        staff_capacity=(),
    )


class AuthoritativeCapacitySourceTests(
    unittest.IsolatedAsyncioTestCase
):
    def make_source(self):
        return AuthoritativeCapacitySource(
            database=object(),
            period_start=START,
            period_end=END,
        )

    async def test_satisfies_protocol(self):
        self.assertIsInstance(
            self.make_source(),
            CapacityBaselineSource,
        )

    async def test_source_identifier(self):
        self.assertEqual(
            AUTHORITATIVE_CAPACITY_SOURCE,
            "authoritative_capacity_v1",
        )

    async def test_owner_and_period_preserved(self):
        mocked = AsyncMock(return_value=make_result())
        with patch(
            "app.intelligence.authoritative_capacity_source."
            "AuthoritativeCapacityResolver.resolve",
            new=mocked,
        ):
            baseline = await self.make_source().get_capacity_baseline(
                context=IntelligenceContext(owner_id="tenant-a")
            )
        self.assertEqual(baseline.owner_id, "tenant-a")
        self.assertEqual(baseline.period_start, START)
        self.assertEqual(baseline.period_end, END)

    async def test_resolver_called_once(self):
        mocked = AsyncMock(return_value=make_result())
        with patch(
            "app.intelligence.authoritative_capacity_source."
            "AuthoritativeCapacityResolver.resolve",
            new=mocked,
        ):
            await self.make_source().get_capacity_baseline(
                context=IntelligenceContext(owner_id="tenant-a")
            )
        self.assertEqual(mocked.await_count, 1)

    async def test_owner_mismatch_fails_closed(self):
        with patch(
            "app.intelligence.authoritative_capacity_source."
            "AuthoritativeCapacityResolver.resolve",
            new=AsyncMock(return_value=make_result("tenant-b")),
        ):
            with self.assertRaises(CapacityDataUnavailable):
                await self.make_source().get_capacity_baseline(
                    context=IntelligenceContext(owner_id="tenant-a")
                )

    async def test_resolution_failure_becomes_unavailable(self):
        with patch(
            "app.intelligence.authoritative_capacity_source."
            "AuthoritativeCapacityResolver.resolve",
            new=AsyncMock(
                side_effect=CapacityConfigurationUnavailable(
                    "missing"
                )
            ),
        ):
            with self.assertRaises(CapacityDataUnavailable):
                await self.make_source().get_capacity_baseline(
                    context=IntelligenceContext(owner_id="tenant-a")
                )
