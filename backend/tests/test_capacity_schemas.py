from datetime import UTC, datetime, timedelta
import unittest

from pydantic import ValidationError

from app.capacity.schemas import (
    CapacityExceptionCreateRequest,
    CapacityProfileUpsertRequest,
    capacity_authoritative_facts,
    StaffCreateRequest,
    StaffScheduleUpsertRequest,
)


class CapacitySchemaTests(unittest.TestCase):
    def test_profile_forbids_owner_id(self) -> None:
        with self.assertRaises(ValidationError):
            CapacityProfileUpsertRequest.model_validate(
                {
                    "owner_id": "64b000000000000000000001",
                    "timezone": "Asia/Yerevan",
                    "slot_duration_minutes": 30,
                }
            )

    def test_profile_accepts_structured_hours(self) -> None:
        payload = CapacityProfileUpsertRequest(
            timezone=" Asia/Yerevan ",
            slot_duration_minutes=30,
            weekly_business_hours=[
                {
                    "weekday": 0,
                    "intervals": [
                        {
                            "start_minute": 540,
                            "end_minute": 1080,
                        }
                    ],
                }
            ],
        )
        self.assertEqual(payload.timezone, "Asia/Yerevan")
        self.assertEqual(
            payload.weekly_business_hours[0].weekday,
            0,
        )

    def test_interval_must_be_positive(self) -> None:
        with self.assertRaises(ValidationError):
            CapacityProfileUpsertRequest(
                timezone="UTC",
                slot_duration_minutes=30,
                weekly_business_hours=[
                    {
                        "weekday": 0,
                        "intervals": [
                            {
                                "start_minute": 600,
                                "end_minute": 600,
                            }
                        ],
                    }
                ],
            )

    def test_staff_name_is_normalized(self) -> None:
        payload = StaffCreateRequest(
            display_name="  Anna   Petrosyan  "
        )
        self.assertEqual(payload.display_name, "Anna Petrosyan")

    def test_schedule_forbids_more_than_seven_days(self) -> None:
        with self.assertRaises(ValidationError):
            StaffScheduleUpsertRequest(
                weekly_schedule=[
                    {"weekday": index % 7, "shifts": []}
                    for index in range(8)
                ]
            )

    def test_staff_exception_requires_staff_id(self) -> None:
        now = datetime.now(UTC)
        with self.assertRaises(ValidationError):
            CapacityExceptionCreateRequest(
                scope="staff",
                effect="unavailable",
                starts_at_utc=now,
                ends_at_utc=now + timedelta(hours=1),
                timezone_snapshot="UTC",
            )

    def test_salon_exception_forbids_staff_id(self) -> None:
        now = datetime.now(UTC)
        with self.assertRaises(ValidationError):
            CapacityExceptionCreateRequest(
                scope="salon",
                staff_id="64b000000000000000000001",
                effect="unavailable",
                starts_at_utc=now,
                ends_at_utc=now + timedelta(hours=1),
                timezone_snapshot="UTC",
            )

    def test_authoritative_fact_names_are_deterministic(self) -> None:
        self.assertEqual(
            capacity_authoritative_facts(
                scope="staff",
                effect="unavailable",
            ),
            ("blocked_periods",),
        )
        self.assertEqual(
            capacity_authoritative_facts(
                scope="salon",
                effect="unavailable",
            ),
            ("blocked_periods", "holidays_closures"),
        )
        self.assertEqual(
            capacity_authoritative_facts(
                scope="salon",
                effect="available",
            ),
            (),
        )

    def test_exception_requires_aware_datetimes(self) -> None:
        now = datetime.now()
        with self.assertRaises(ValidationError):
            CapacityExceptionCreateRequest(
                scope="salon",
                effect="unavailable",
                starts_at_utc=now,
                ends_at_utc=now + timedelta(hours=1),
                timezone_snapshot="UTC",
            )

    def test_exception_exposes_authoritative_facts(self) -> None:
        now = datetime.now(UTC)
        payload = CapacityExceptionCreateRequest(
            scope="salon",
            effect="unavailable",
            starts_at_utc=now,
            ends_at_utc=now + timedelta(hours=1),
            timezone_snapshot="UTC",
        )
        self.assertEqual(
            payload.authoritative_facts,
            ("blocked_periods", "holidays_closures"),
        )


if __name__ == "__main__":
    unittest.main()
