from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.capacity.schemas import (
    BusinessDay,
    CapacityExceptionCreateRequest,
    CapacityProfileUpsertRequest,
    StaffScheduleDay,
    StaffScheduleUpsertRequest,
    TimeInterval,
)


class CapacityValidationError(ValueError):
    """Raised when capacity configuration is structurally invalid."""


class CapacityConfigurationInvalid(CapacityValidationError):
    """Raised when a configuration cannot be activated."""

    def __init__(self, missing: Iterable[str]) -> None:
        normalized = tuple(dict.fromkeys(missing))
        self.missing = normalized
        message = ", ".join(normalized)
        super().__init__(
            f"capacity configuration is incomplete: {message}"
        )


def validate_timezone_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise CapacityValidationError("timezone is required")
    try:
        ZoneInfo(normalized)
    except ZoneInfoNotFoundError as error:
        raise CapacityValidationError(
            "timezone must be a valid IANA timezone"
        ) from error
    return normalized


def normalize_utc(value: datetime, *, field_name: str) -> datetime:
    if value.tzinfo is None:
        raise CapacityValidationError(
            f"{field_name} must be timezone-aware"
        )
    return value.astimezone(UTC)


def _validate_non_overlapping_intervals(
    intervals: list[TimeInterval],
    *,
    field_name: str,
) -> None:
    ordered = sorted(
        intervals,
        key=lambda item: (item.start_minute, item.end_minute),
    )
    previous_end: int | None = None
    for interval in ordered:
        if previous_end is not None:
            if interval.start_minute < previous_end:
                raise CapacityValidationError(
                    f"{field_name} intervals cannot overlap"
                )
        previous_end = interval.end_minute


def _validate_unique_weekdays(
    days: Iterable[BusinessDay | StaffScheduleDay],
    *,
    field_name: str,
) -> None:
    weekdays: set[int] = set()
    for day in days:
        if day.weekday in weekdays:
            raise CapacityValidationError(
                f"{field_name} contains duplicate weekdays"
            )
        weekdays.add(day.weekday)


def validate_business_hours(
    days: list[BusinessDay],
) -> None:
    _validate_unique_weekdays(
        days,
        field_name="weekly_business_hours",
    )
    for day in days:
        _validate_non_overlapping_intervals(
            day.intervals,
            field_name=(
                "weekly_business_hours"
                f"[{day.weekday}]"
            ),
        )


def validate_profile_request(
    payload: CapacityProfileUpsertRequest,
) -> None:
    validate_timezone_name(payload.timezone)
    if payload.slot_duration_minutes % 5 != 0:
        raise CapacityValidationError(
            "slot_duration_minutes must be a multiple of 5"
        )
    validate_business_hours(payload.weekly_business_hours)


def validate_staff_schedule(
    days: list[StaffScheduleDay],
) -> None:
    _validate_unique_weekdays(
        days,
        field_name="weekly_schedule",
    )
    for day in days:
        shift_intervals = [
            TimeInterval(
                start_minute=shift.start_minute,
                end_minute=shift.end_minute,
            )
            for shift in day.shifts
        ]
        _validate_non_overlapping_intervals(
            shift_intervals,
            field_name=f"weekly_schedule[{day.weekday}].shifts",
        )
        for shift in day.shifts:
            _validate_non_overlapping_intervals(
                shift.breaks,
                field_name=(
                    "weekly_schedule"
                    f"[{day.weekday}].breaks"
                ),
            )
            for item in shift.breaks:
                if (
                    item.start_minute < shift.start_minute
                    or item.end_minute > shift.end_minute
                ):
                    raise CapacityValidationError(
                        "breaks must be contained within their shift"
                    )


def validate_schedule_request(
    payload: StaffScheduleUpsertRequest,
) -> None:
    validate_staff_schedule(payload.weekly_schedule)


def validate_exception_request(
    payload: CapacityExceptionCreateRequest,
) -> tuple[datetime, datetime]:
    validate_timezone_name(payload.timezone_snapshot)
    starts_at = normalize_utc(
        payload.starts_at_utc,
        field_name="starts_at_utc",
    )
    ends_at = normalize_utc(
        payload.ends_at_utc,
        field_name="ends_at_utc",
    )
    if ends_at <= starts_at:
        raise CapacityValidationError(
            "ends_at_utc must be later than starts_at_utc"
        )
    return starts_at, ends_at


def has_business_hours(days: object) -> bool:
    if not isinstance(days, list):
        return False
    return any(
        isinstance(day, dict) and bool(day.get("intervals"))
        for day in days
    )


def has_staffed_business_overlap(
    business_days: list[BusinessDay],
    schedule_days: list[StaffScheduleDay],
) -> bool:
    business_by_weekday = {
        day.weekday: day.intervals
        for day in business_days
    }
    for schedule_day in schedule_days:
        business_intervals = business_by_weekday.get(
            schedule_day.weekday,
            [],
        )
        for shift in schedule_day.shifts:
            for interval in business_intervals:
                if max(
                    shift.start_minute,
                    interval.start_minute,
                ) < min(
                    shift.end_minute,
                    interval.end_minute,
                ):
                    return True
    return False


def has_staff_shifts(days: object) -> bool:
    if not isinstance(days, list):
        return False
    return any(
        isinstance(day, dict) and bool(day.get("shifts"))
        for day in days
    )
