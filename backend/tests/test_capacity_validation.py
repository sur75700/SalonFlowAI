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
