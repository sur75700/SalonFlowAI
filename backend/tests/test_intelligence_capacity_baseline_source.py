import unittest
from datetime import UTC, datetime

from app.intelligence.capacity import (
    CAPACITY_BASELINE_METADATA_KEY,
    CapacityBaseline,
    require_capacity_baseline,
)
from app.intelligence.capacity_baseline_source import (
    CallableCapacityBaselineSource,
    CapacityBaselineSource,
    ExplicitCapacityBaselineSource,
    attach_capacity_baseline,
    prepare_capacity_context,
    resolve_capacity_baseline,
)
from app.intelligence.context import IntelligenceContext


START = datetime(
    2026,
    8,
    1,
    tzinfo=UTC,
)

END = datetime(
    2026,
    8,
    8,
    tzinfo=UTC,
)


def make_baseline(
    *,
    owner_id: str = "tenant-a",
    total_slots: int = 40,
) -> CapacityBaseline:
    return CapacityBaseline(
        owner_id=owner_id,
        period_start=START,
        period_end=END,
        total_slots=total_slots,
        active_staff_count=4,
        available_minutes=9_600,
        source="trusted_schedule_configuration",
        blocked_period_count=2,
        holiday_closure_count=1,
        availability_override_count=1,
    )


def make_context(
    *,
    owner_id: str = "tenant-a",
    metadata=None,
) -> IntelligenceContext:
    return IntelligenceContext(
        owner_id=owner_id,
        currency="AMD",
        generated_at=END,
        metadata=(
            dict(metadata)
            if metadata is not None
            else {}
        ),
    )


class StructuralCapacitySource:
    def __init__(self, baseline):
        self.baseline = baseline

    def get_capacity_baseline(
        self,
        *,
        context,
    ):
        return self.baseline


class InvalidCapacitySource:
    pass


class CapacityBaselineSourceTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_explicit_source_prepares_context(
        self,
    ):
        baseline = make_baseline()
        context = make_context()

        prepared = await prepare_capacity_context(
            context=context,
            source=ExplicitCapacityBaselineSource(
                baseline=baseline
            ),
        )

        self.assertIs(
            require_capacity_baseline(prepared),
            baseline,
        )
        self.assertEqual(
            require_capacity_baseline(
                prepared
            ).holiday_closure_count,
            1,
        )

    async def test_callable_source_supports_async_loader(
        self,
    ):
        baseline = make_baseline()
        calls = []

        async def loader(context):
            calls.append(context.owner_id)
            return baseline

        prepared = await prepare_capacity_context(
            context=make_context(),
            source=CallableCapacityBaselineSource(
                loader=loader
            ),
        )

        self.assertEqual(calls, ["tenant-a"])
        self.assertIs(
            require_capacity_baseline(prepared),
            baseline,
        )

    async def test_original_metadata_is_not_mutated(
        self,
    ):
        metadata = {
            "request_id": "request-1",
        }

        context = make_context(
            metadata=metadata
        )

        prepared = await prepare_capacity_context(
            context=context,
            source=ExplicitCapacityBaselineSource(
                baseline=make_baseline()
            ),
        )

        self.assertEqual(
            context.metadata,
            {
                "request_id": "request-1",
            },
        )

        self.assertNotIn(
            CAPACITY_BASELINE_METADATA_KEY,
            metadata,
        )

        self.assertEqual(
            prepared.metadata["request_id"],
            "request-1",
        )

        self.assertIn(
            CAPACITY_BASELINE_METADATA_KEY,
            prepared.metadata,
        )

    async def test_owner_mismatch_is_rejected(
        self,
    ):
        with self.assertRaisesRegex(
            RuntimeError,
            "capacity baseline owner does not match "
            "context owner",
        ):
            await resolve_capacity_baseline(
                context=make_context(
                    owner_id="tenant-a"
                ),
                source=ExplicitCapacityBaselineSource(
                    baseline=make_baseline(
                        owner_id="tenant-b"
                    )
                ),
            )

    async def test_invalid_source_result_is_rejected(
        self,
    ):
        source = CallableCapacityBaselineSource(
            loader=lambda context: object()
        )

        with self.assertRaisesRegex(
            TypeError,
            "capacity source must return "
            "a CapacityBaseline",
        ):
            await resolve_capacity_baseline(
                context=make_context(),
                source=source,
            )

    async def test_invalid_source_contract_is_rejected(
        self,
    ):
        with self.assertRaisesRegex(
            TypeError,
            "source must satisfy "
            "CapacityBaselineSource",
        ):
            await prepare_capacity_context(
                context=make_context(),
                source=InvalidCapacitySource(),
            )

    def test_conflicting_existing_baseline_is_rejected(
        self,
    ):
        original = make_baseline(
            total_slots=40
        )

        replacement = make_baseline(
            total_slots=50
        )

        context = make_context(
            metadata={
                CAPACITY_BASELINE_METADATA_KEY:
                    original,
            }
        )

        with self.assertRaisesRegex(
            RuntimeError,
            "context already contains a different "
            "capacity baseline",
        ):
            attach_capacity_baseline(
                context=context,
                baseline=replacement,
            )

    def test_different_fact_counts_are_conflicting(
        self,
    ):
        original = make_baseline()
        replacement = CapacityBaseline(
            owner_id=original.owner_id,
            period_start=original.period_start,
            period_end=original.period_end,
            total_slots=original.total_slots,
            active_staff_count=original.active_staff_count,
            available_minutes=original.available_minutes,
            source=original.source,
            blocked_period_count=3,
            holiday_closure_count=1,
            availability_override_count=1,
        )
        context = make_context(
            metadata={
                CAPACITY_BASELINE_METADATA_KEY: original,
            }
        )
        with self.assertRaisesRegex(
            RuntimeError,
            "different capacity baseline",
        ):
            attach_capacity_baseline(
                context=context,
                baseline=replacement,
            )

    def test_same_existing_baseline_is_idempotent(
        self,
    ):
        baseline = make_baseline()

        context = make_context(
            metadata={
                CAPACITY_BASELINE_METADATA_KEY:
                    baseline,
            }
        )

        prepared = attach_capacity_baseline(
            context=context,
            baseline=baseline,
        )

        self.assertIs(prepared, context)

    def test_protocol_supports_structural_sources(
        self,
    ):
        source = StructuralCapacitySource(
            make_baseline()
        )

        self.assertIsInstance(
            source,
            CapacityBaselineSource,
        )


if __name__ == "__main__":
    unittest.main()
