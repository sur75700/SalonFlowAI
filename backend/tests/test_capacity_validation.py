from datetime import UTC, datetime, timedelta
import unittest

from app.capacity.schemas import (
    CapacityExceptionCreateRequest,
    CapacityProfileUpsertRequest,
    StaffScheduleUpsertRequest,
)
from app.capacity.validation import (
    CapacityValidationError,
    validate_exception_request,
    validate_profile_request,
    validate_schedule_request,
    validate_timezone_name,
)
from app.capacity.validators import (
    CapacityFactValidationError,
    validate_capacity_exception_document,
    validate_capacity_exception_documents,
)


class CapacityValidationTests(unittest.TestCase):
    def test_timezone_must_exist(self) -> None:
        with self.assertRaisesRegex(
            CapacityValidationError,
            "IANA timezone",
        ):
            validate_timezone_name("Mars/Olympus")

    def test_slot_duration_is_multiple_of_five(self) -> None:
        payload = CapacityProfileUpsertRequest(
            timezone="UTC",
            slot_duration_minutes=31,
        )
        with self.assertRaisesRegex(
            CapacityValidationError,
            "multiple of 5",
        ):
            validate_profile_request(payload)

    def test_business_intervals_cannot_overlap(self) -> None:
        payload = CapacityProfileUpsertRequest(
            timezone="UTC",
            slot_duration_minutes=30,
            weekly_business_hours=[
                {
                    "weekday": 1,
                    "intervals": [
                        {
                            "start_minute": 540,
                            "end_minute": 720,
                        },
                        {
                            "start_minute": 700,
                            "end_minute": 900,
                        },
                    ],
                }
            ],
        )
        with self.assertRaisesRegex(
            CapacityValidationError,
            "cannot overlap",
        ):
            validate_profile_request(payload)

    def test_business_days_cannot_repeat(self) -> None:
        payload = CapacityProfileUpsertRequest(
            timezone="UTC",
            slot_duration_minutes=30,
            weekly_business_hours=[
                {"weekday": 1, "intervals": []},
                {"weekday": 1, "intervals": []},
            ],
        )
        with self.assertRaisesRegex(
            CapacityValidationError,
            "duplicate weekdays",
        ):
            validate_profile_request(payload)

    def test_staff_shifts_cannot_overlap(self) -> None:
        payload = StaffScheduleUpsertRequest(
            weekly_schedule=[
                {
                    "weekday": 2,
                    "shifts": [
                        {
                            "start_minute": 540,
                            "end_minute": 720,
                        },
                        {
                            "start_minute": 700,
                            "end_minute": 900,
                        },
                    ],
                }
            ]
        )
        with self.assertRaisesRegex(
            CapacityValidationError,
            "cannot overlap",
        ):
            validate_schedule_request(payload)

    def test_break_must_stay_inside_shift(self) -> None:
        payload = StaffScheduleUpsertRequest(
            weekly_schedule=[
                {
                    "weekday": 2,
                    "shifts": [
                        {
                            "start_minute": 540,
                            "end_minute": 720,
                            "breaks": [
                                {
                                    "start_minute": 500,
                                    "end_minute": 550,
                                }
                            ],
                        }
                    ],
                }
            ]
        )
        with self.assertRaisesRegex(
            CapacityValidationError,
            "contained within",
        ):
            validate_schedule_request(payload)

    def test_persisted_fact_is_tenant_owned_and_classified(
        self,
    ) -> None:
        now = datetime.now(UTC)
        fact = validate_capacity_exception_document(
            {
                "owner_id": "tenant-a",
                "schema_version": 1,
                "status": "active",
                "scope": "salon",
                "staff_id": None,
                "effect": "unavailable",
                "starts_at_utc": now,
                "ends_at_utc": now + timedelta(hours=2),
                "timezone_snapshot": "UTC",
            },
            owner_id="tenant-a",
        )
        self.assertTrue(fact.is_blocked_period)
        self.assertTrue(fact.is_holiday_or_closure)

    def test_persisted_fact_owner_mismatch_fails_closed(
        self,
    ) -> None:
        now = datetime.now(UTC)
        with self.assertRaisesRegex(
            CapacityFactValidationError,
            "owner does not match",
        ):
            validate_capacity_exception_document(
                {
                    "owner_id": "tenant-b",
                    "schema_version": 1,
                    "status": "active",
                    "scope": "staff",
                    "staff_id": "staff-1",
                    "effect": "unavailable",
                    "starts_at_utc": now,
                    "ends_at_utc": now + timedelta(hours=2),
                    "timezone_snapshot": "UTC",
                },
                owner_id="tenant-a",
            )

    def test_cancelled_facts_are_validated_then_excluded(
        self,
    ) -> None:
        now = datetime.now(UTC)
        facts = validate_capacity_exception_documents(
            [
                {
                    "owner_id": "tenant-a",
                    "schema_version": 1,
                    "status": "cancelled",
                    "scope": "staff",
                    "staff_id": "staff-1",
                    "effect": "unavailable",
                    "starts_at_utc": now,
                    "ends_at_utc": now + timedelta(hours=2),
                    "timezone_snapshot": "UTC",
                }
            ],
            owner_id="tenant-a",
        )
        self.assertEqual(facts, ())

    def test_fact_authoritative_facts_are_derived(
        self,
    ) -> None:
        now = datetime.now(UTC)
        fact = validate_capacity_exception_document(
            {
                "owner_id": "tenant-a",
                "schema_version": 1,
                "status": "active",
                "scope": "staff",
                "staff_id": "staff-1",
                "effect": "unavailable",
                "starts_at_utc": now,
                "ends_at_utc": now + timedelta(hours=1),
                "timezone_snapshot": "UTC",
            },
            owner_id="tenant-a",
        )
        self.assertEqual(
            fact.authoritative_facts,
            ("blocked_periods",),
        )
        with self.assertRaises(TypeError):
            type(fact)(
                owner_id=fact.owner_id,
                scope=fact.scope,
                staff_id=fact.staff_id,
                effect=fact.effect,
                status=fact.status,
                starts_at_utc=fact.starts_at_utc,
                ends_at_utc=fact.ends_at_utc,
                timezone_snapshot=fact.timezone_snapshot,
                authoritative_facts=("holidays_closures",),
            )

    def test_unsupported_persisted_fact_schema_fails_closed(
        self,
    ) -> None:
        now = datetime.now(UTC)
        with self.assertRaisesRegex(
            CapacityFactValidationError,
            "unsupported",
        ):
            validate_capacity_exception_document(
                {
                    "owner_id": "tenant-a",
                    "schema_version": 2,
                    "status": "active",
                    "scope": "salon",
                    "staff_id": None,
                    "effect": "unavailable",
                    "starts_at_utc": now,
                    "ends_at_utc": now + timedelta(hours=1),
                    "timezone_snapshot": "UTC",
                },
                owner_id="tenant-a",
            )

    def test_invalid_persisted_fact_period_fails_closed(
        self,
    ) -> None:
        now = datetime.now(UTC)
        with self.assertRaisesRegex(
            CapacityFactValidationError,
            "later than",
        ):
            validate_capacity_exception_document(
                {
                    "owner_id": "tenant-a",
                    "schema_version": 1,
                    "status": "active",
                    "scope": "salon",
                    "staff_id": None,
                    "effect": "unavailable",
                    "starts_at_utc": now,
                    "ends_at_utc": now,
                    "timezone_snapshot": "UTC",
                },
                owner_id="tenant-a",
            )

    def test_exception_is_normalized_to_utc(self) -> None:
        now = datetime.now(UTC)
        payload = CapacityExceptionCreateRequest(
            scope="salon",
            effect="unavailable",
            starts_at_utc=now,
            ends_at_utc=now + timedelta(hours=2),
            timezone_snapshot="UTC",
        )
        starts_at, ends_at = validate_exception_request(payload)
        self.assertEqual(starts_at.tzinfo, UTC)
        self.assertEqual(ends_at.tzinfo, UTC)


if __name__ == "__main__":
    unittest.main()
