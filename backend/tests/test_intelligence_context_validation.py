import unittest
from datetime import date

from app.intelligence.context import IntelligenceContext
from app.intelligence.context_validation import (
    validate_intelligence_context,
)
from app.intelligence.models import (
    AnalysisWindow,
    BusinessState,
    IntelligenceFlags,
)


class IntelligenceContextValidationTests(
    unittest.TestCase
):

    def test_valid_context_passes(self) -> None:
        context = IntelligenceContext(
            owner_id="tenant-cosmos",
            window=AnalysisWindow(
                start=date(2026, 1, 1),
                end=date(2026, 1, 31),
            ),
            business=BusinessState(
                active_staff_count=5,
                open_slots=10,
                booked_slots=90,
            ),
        )

        result = validate_intelligence_context(
            context
        )

        self.assertIs(
            result,
            context,
        )


    def test_existing_context_passes_owner_validation(self) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a"
        )

        result = validate_intelligence_context(
            context
        )

        self.assertEqual(
            result.owner_id,
            "tenant-a",
        )


    def test_window_validation_path(self) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a",
            window=AnalysisWindow(
                start=date(2026, 1, 1),
                end=date(2026, 1, 31),
            ),
        )

        result = validate_intelligence_context(
            context
        )

        self.assertEqual(
            result.window.days,
            31,
        )


    def test_business_state_is_validated(self) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a",
            business=BusinessState(
                booked_slots=100,
                open_slots=0,
            ),
        )

        result = validate_intelligence_context(
            context
        )

        self.assertEqual(
            result.owner_id,
            "tenant-a",
        )


    def test_flags_are_available(self) -> None:
        context = IntelligenceContext(
            owner_id="tenant-a",
            flags=IntelligenceFlags(
                automation_enabled=True,
            ),
        )

        result = validate_intelligence_context(
            context
        )

        self.assertTrue(
            result.flags.automation_enabled
        )


if __name__ == "__main__":
    unittest.main()
