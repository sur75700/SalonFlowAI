from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Any, Iterable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.capacity.repository import (
    CapacityReadLimitExceeded,
    CapacityRepository,
    CapacityRepositoryError,
)
from app.capacity.validators import (
    CapacityExceptionFact,
    CapacityFactValidationError,
    validate_capacity_exception_documents,
)


MAX_ANALYSIS_DAYS = 366
SUPPORTED_SCHEMA_VERSION = 1


class CapacityResolutionError(RuntimeError):
    pass


class CapacityConfigurationUnavailable(CapacityResolutionError):
    pass


class CapacityConfigurationInvalid(CapacityResolutionError):
    pass


@dataclass(frozen=True, slots=True, order=True)
class ResolvedInterval:
    start_utc: datetime
    end_utc: datetime

    def __post_init__(self) -> None:
        start = _aware_utc(self.start_utc, field_name="start_utc")
        end = _aware_utc(self.end_utc, field_name="end_utc")
        if end <= start:
            raise ValueError("end_utc must be later than start_utc")
        object.__setattr__(self, "start_utc", start)
        object.__setattr__(self, "end_utc", end)

    @property
    def minutes(self) -> int:
        return int((self.end_utc - self.start_utc).total_seconds() // 60)


@dataclass(frozen=True, slots=True)
class ResolvedStaffCapacity:
    staff_id: str
    intervals: tuple[ResolvedInterval, ...]


@dataclass(frozen=True, slots=True)
class AuthoritativeCapacityResult:
    owner_id: str
    period_start: datetime
    period_end: datetime
    slot_duration_minutes: int
    active_staff_count: int
    available_minutes: int
    total_slots: int
    staff_capacity: tuple[ResolvedStaffCapacity, ...]
    blocked_period_count: int = 0
    holiday_closure_count: int = 0
    availability_override_count: int = 0

    def __post_init__(self) -> None:
        owner = self.owner_id.strip()
        if not owner:
            raise ValueError("owner_id is required")
        start = _aware_utc(self.period_start, field_name="period_start")
        end = _aware_utc(self.period_end, field_name="period_end")
        if end <= start:
            raise ValueError("period_end must be later than period_start")
        for name, value in (
            ("slot_duration_minutes", self.slot_duration_minutes),
            ("active_staff_count", self.active_staff_count),
            ("available_minutes", self.available_minutes),
            ("total_slots", self.total_slots),
            ("blocked_period_count", self.blocked_period_count),
            ("holiday_closure_count", self.holiday_closure_count),
            (
                "availability_override_count",
                self.availability_override_count,
            ),
        ):
            if isinstance(value, bool) or not isinstance(value, int):
                raise TypeError(f"{name} must be an integer")
            if value < 0:
                raise ValueError(f"{name} cannot be negative")
        if self.slot_duration_minutes <= 0:
            raise ValueError("slot_duration_minutes must be positive")
        if not isinstance(self.staff_capacity, tuple):
            raise TypeError("staff_capacity must be a tuple")
        if self.holiday_closure_count > self.blocked_period_count:
            raise ValueError(
                "holiday_closure_count cannot exceed "
                "blocked_period_count"
            )
        object.__setattr__(self, "owner_id", owner)
        object.__setattr__(self, "period_start", start)
        object.__setattr__(self, "period_end", end)


def _aware_utc(value: datetime, *, field_name: str) -> datetime:
    if not isinstance(value, datetime):
        raise TypeError(f"{field_name} must be a datetime")
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must be timezone-aware")
    return value.astimezone(UTC)


def _schema_version(document: dict[str, Any], *, label: str) -> None:
    if document.get("schema_version") != SUPPORTED_SCHEMA_VERSION:
        raise CapacityConfigurationInvalid(
            f"unsupported {label} schema version"
        )


def _identifier(
    document: dict[str, Any],
    *,
    field_name: str,
) -> str:
    value = document.get(field_name)
    if value is None and field_name == "staff_id":
        value = document.get("_id")
    text = str(value).strip() if value is not None else ""
    if not text:
        raise CapacityConfigurationInvalid(f"{field_name} is required")
    return text


def _minute(value: Any, *, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise CapacityConfigurationInvalid(f"{field_name} must be an integer")
    if value < 0 or value > 1440:
        raise CapacityConfigurationInvalid(
            f"{field_name} must be between 0 and 1440"
        )
    return value


def _normalize(
    intervals: Iterable[ResolvedInterval],
) -> tuple[ResolvedInterval, ...]:
    merged: list[ResolvedInterval] = []
    for current in sorted(intervals):
        if not merged or current.start_utc > merged[-1].end_utc:
            merged.append(current)
            continue
        previous = merged[-1]
        merged[-1] = ResolvedInterval(
            previous.start_utc,
            max(previous.end_utc, current.end_utc),
        )
    return tuple(merged)


def _clip(
    intervals: Iterable[ResolvedInterval],
    start: datetime,
    end: datetime,
) -> tuple[ResolvedInterval, ...]:
    clipped: list[ResolvedInterval] = []
    for interval in intervals:
        item_start = max(interval.start_utc, start)
        item_end = min(interval.end_utc, end)
        if item_end > item_start:
            clipped.append(ResolvedInterval(item_start, item_end))
    return _normalize(clipped)


def _intersect(
    left: Iterable[ResolvedInterval],
    right: Iterable[ResolvedInterval],
) -> tuple[ResolvedInterval, ...]:
    a = list(_normalize(left))
    b = list(_normalize(right))
    result: list[ResolvedInterval] = []
    i = j = 0
    while i < len(a) and j < len(b):
        start = max(a[i].start_utc, b[j].start_utc)
        end = min(a[i].end_utc, b[j].end_utc)
        if end > start:
            result.append(ResolvedInterval(start, end))
        if a[i].end_utc <= b[j].end_utc:
            i += 1
        else:
            j += 1
    return tuple(result)


def _subtract(
    base: Iterable[ResolvedInterval],
    removed: Iterable[ResolvedInterval],
) -> tuple[ResolvedInterval, ...]:
    fragments = list(_normalize(base))
    for cut in _normalize(removed):
        next_fragments: list[ResolvedInterval] = []
        for interval in fragments:
            if (
                cut.end_utc <= interval.start_utc
                or cut.start_utc >= interval.end_utc
            ):
                next_fragments.append(interval)
                continue
            if cut.start_utc > interval.start_utc:
                next_fragments.append(
                    ResolvedInterval(interval.start_utc, cut.start_utc)
                )
            if cut.end_utc < interval.end_utc:
                next_fragments.append(
                    ResolvedInterval(cut.end_utc, interval.end_utc)
                )
        fragments = next_fragments
    return _normalize(fragments)


def _local_boundary(
    local_date: date,
    minute: int,
    timezone: ZoneInfo,
    *,
    is_end: bool,
) -> datetime:
    if minute == 1440:
        local_date += timedelta(days=1)
        minute = 0
    naive = datetime.combine(
        local_date,
        time(hour=minute // 60, minute=minute % 60),
    )
    candidates: list[datetime] = []
    for fold in (0, 1):
        local = naive.replace(tzinfo=timezone, fold=fold)
        utc_value = local.astimezone(UTC)
        if utc_value.astimezone(timezone).replace(tzinfo=None) == naive:
            candidates.append(utc_value)
    unique = sorted(set(candidates))
    if not unique:
        raise CapacityConfigurationInvalid(
            "schedule boundary falls in a nonexistent local time"
        )
    return unique[-1] if is_end else unique[0]


def _expand_weekly(
    weekly: Any,
    timezone: ZoneInfo,
    start: datetime,
    end: datetime,
    *,
    staff: bool,
) -> tuple[ResolvedInterval, ...]:
    if not isinstance(weekly, list):
        raise CapacityConfigurationInvalid("weekly schedule must be a list")
    by_weekday: dict[int, dict[str, Any]] = {}
    for day_value in weekly:
        if not isinstance(day_value, dict):
            raise CapacityConfigurationInvalid(
                "weekly schedule day must be an object"
            )
        weekday = day_value.get("weekday")
        if (
            isinstance(weekday, bool)
            or not isinstance(weekday, int)
            or weekday < 0
            or weekday > 6
            or weekday in by_weekday
        ):
            raise CapacityConfigurationInvalid(
                "weekday is invalid or repeated"
            )
        by_weekday[weekday] = day_value

    local_date = start.astimezone(timezone).date() - timedelta(days=1)
    final_date = end.astimezone(timezone).date() + timedelta(days=1)
    result: list[ResolvedInterval] = []

    while local_date <= final_date:
        day_value = by_weekday.get(local_date.weekday())
        if day_value is not None:
            key = "shifts" if staff else "intervals"
            raw_intervals = day_value.get(key, [])
            if not isinstance(raw_intervals, list):
                raise CapacityConfigurationInvalid(
                    "daily intervals must be a list"
                )
            for raw in raw_intervals:
                if not isinstance(raw, dict):
                    raise CapacityConfigurationInvalid(
                        "interval must be an object"
                    )
                start_minute = _minute(
                    raw.get("start_minute"),
                    field_name="start_minute",
                )
                end_minute = _minute(
                    raw.get("end_minute"),
                    field_name="end_minute",
                )
                if end_minute <= start_minute:
                    raise CapacityConfigurationInvalid(
                        "overnight or empty intervals are unsupported"
                    )
                interval = ResolvedInterval(
                    _local_boundary(
                        local_date,
                        start_minute,
                        timezone,
                        is_end=False,
                    ),
                    _local_boundary(
                        local_date,
                        end_minute,
                        timezone,
                        is_end=True,
                    ),
                )
                if not staff:
                    result.append(interval)
                    continue
                breaks: list[ResolvedInterval] = []
                raw_breaks = raw.get("breaks", [])
                if not isinstance(raw_breaks, list):
                    raise CapacityConfigurationInvalid(
                        "breaks must be a list"
                    )
                for raw_break in raw_breaks:
                    break_start = _minute(
                        raw_break.get("start_minute"),
                        field_name="break.start_minute",
                    )
                    break_end = _minute(
                        raw_break.get("end_minute"),
                        field_name="break.end_minute",
                    )
                    if (
                        break_end <= break_start
                        or break_start < start_minute
                        or break_end > end_minute
                    ):
                        raise CapacityConfigurationInvalid(
                            "break must stay inside its shift"
                        )
                    breaks.append(
                        ResolvedInterval(
                            _local_boundary(
                                local_date,
                                break_start,
                                timezone,
                                is_end=False,
                            ),
                            _local_boundary(
                                local_date,
                                break_end,
                                timezone,
                                is_end=True,
                            ),
                        )
                    )
                result.extend(_subtract((interval,), breaks))
        local_date += timedelta(days=1)
    return _clip(result, start, end)


def _exception_intervals(
    exceptions: Iterable[CapacityExceptionFact],
    *,
    scope: str,
    effect: str,
    staff_id: str | None = None,
) -> tuple[ResolvedInterval, ...]:
    result: list[ResolvedInterval] = []
    for item in exceptions:
        if item.scope != scope or item.effect != effect:
            continue
        if scope == "staff" and item.staff_id != staff_id:
            continue
        result.append(
            ResolvedInterval(
                item.starts_at_utc,
                item.ends_at_utc,
            )
        )
    return _normalize(result)


class AuthoritativeCapacityResolver:
    def __init__(self, repository: CapacityRepository) -> None:
        if not isinstance(repository, CapacityRepository):
            raise TypeError("repository must be a CapacityRepository")
        self._repository = repository

    async def resolve(
        self,
        *,
        owner_id: str,
        period_start: datetime,
        period_end: datetime,
    ) -> AuthoritativeCapacityResult:
        owner = owner_id.strip() if isinstance(owner_id, str) else ""
        if not owner:
            raise CapacityConfigurationInvalid("owner_id is required")
        try:
            start = _aware_utc(period_start, field_name="period_start")
            end = _aware_utc(period_end, field_name="period_end")
        except (TypeError, ValueError) as error:
            raise CapacityConfigurationInvalid(str(error)) from error
        if end <= start:
            raise CapacityConfigurationInvalid(
                "period_end must be later than period_start"
            )
        if end - start > timedelta(days=MAX_ANALYSIS_DAYS):
            raise CapacityConfigurationInvalid(
                "analysis window exceeds the supported limit"
            )

        try:
            profile = await self._repository.get_profile(
                owner_id=owner,
            )
            if profile is None or profile.get("status") != "active":
                raise CapacityConfigurationUnavailable(
                    "active capacity profile is required"
                )
            _schema_version(profile, label="profile")
            timezone_name = profile.get("timezone")
            if not isinstance(timezone_name, str):
                raise CapacityConfigurationInvalid("timezone is required")
            try:
                timezone = ZoneInfo(timezone_name)
            except ZoneInfoNotFoundError as error:
                raise CapacityConfigurationInvalid(
                    "persisted timezone is invalid"
                ) from error
            slot_duration = profile.get("slot_duration_minutes")
            if (
                isinstance(slot_duration, bool)
                or not isinstance(slot_duration, int)
                or slot_duration < 5
                or slot_duration > 120
                or slot_duration % 5 != 0
            ):
                raise CapacityConfigurationInvalid(
                    "persisted slot duration is invalid"
                )

            staff_documents = (
                await self._repository.list_resolution_staff(owner)
            )
            staff_ids = [
                _identifier(item, field_name="staff_id")
                for item in staff_documents
            ]
            schedules = await self._repository.list_resolution_schedules(
                owner,
                staff_ids,
            )
            exceptions = await self._repository.list_resolution_exceptions(
                owner,
                start,
                end,
            )
        except CapacityReadLimitExceeded as error:
            raise CapacityConfigurationUnavailable(
                "capacity configuration read limit exceeded"
            ) from error
        except CapacityRepositoryError as error:
            raise CapacityConfigurationUnavailable(str(error)) from error

        try:
            capacity_facts = validate_capacity_exception_documents(
                exceptions,
                owner_id=owner,
            )
        except CapacityFactValidationError as error:
            raise CapacityConfigurationInvalid(str(error)) from error

        known_staff_ids = set(staff_ids)
        unknown_staff_ids = sorted(
            {
                fact.staff_id
                for fact in capacity_facts
                if (
                    fact.scope == "staff"
                    and fact.staff_id is not None
                    and fact.staff_id not in known_staff_ids
                )
            }
        )
        if unknown_staff_ids:
            raise CapacityConfigurationInvalid(
                "capacity exception references unknown staff"
            )

        blocked_period_count = sum(
            fact.is_blocked_period
            for fact in capacity_facts
        )
        holiday_closure_count = sum(
            fact.is_holiday_or_closure
            for fact in capacity_facts
        )
        availability_override_count = sum(
            fact.is_availability_override
            for fact in capacity_facts
        )

        schedule_by_staff: dict[str, dict[str, Any]] = {}
        for schedule in schedules:
            _schema_version(schedule, label="schedule")
            if str(schedule.get("owner_id", "")).strip() != owner:
                raise CapacityConfigurationInvalid(
                    "schedule owner does not match"
                )
            staff_id = _identifier(schedule, field_name="staff_id")
            if staff_id in schedule_by_staff:
                raise CapacityConfigurationInvalid(
                    "duplicate staff schedule"
                )
            schedule_by_staff[staff_id] = schedule

        salon_open = _expand_weekly(
            profile.get("weekly_business_hours"),
            timezone,
            start,
            end,
            staff=False,
        )
        salon_available = _clip(
            _exception_intervals(
                capacity_facts,
                scope="salon",
                effect="available",
            ),
            start,
            end,
        )
        salon_unavailable = _clip(
            _exception_intervals(
                capacity_facts,
                scope="salon",
                effect="unavailable",
            ),
            start,
            end,
        )
        salon_envelope = _subtract(
            _normalize((*salon_open, *salon_available)),
            salon_unavailable,
        )

        resolved_staff: list[ResolvedStaffCapacity] = []
        for staff_document in staff_documents:
            _schema_version(staff_document, label="staff")
            if str(staff_document.get("owner_id", "")).strip() != owner:
                raise CapacityConfigurationInvalid(
                    "staff owner does not match"
                )
            staff_id = _identifier(
                staff_document,
                field_name="staff_id",
            )
            schedule = schedule_by_staff.get(staff_id)
            if schedule is None:
                raise CapacityConfigurationUnavailable(
                    "every included staff member requires a schedule"
                )
            weekly = _expand_weekly(
                schedule.get("weekly_schedule"),
                timezone,
                start,
                end,
                staff=True,
            )
            intervals = _intersect(weekly, salon_envelope)
            staff_available = _intersect(
                _clip(
                    _exception_intervals(
                        capacity_facts,
                        scope="staff",
                        effect="available",
                        staff_id=staff_id,
                    ),
                    start,
                    end,
                ),
                salon_envelope,
            )
            staff_unavailable = _clip(
                _exception_intervals(
                    capacity_facts,
                    scope="staff",
                    effect="unavailable",
                    staff_id=staff_id,
                ),
                start,
                end,
            )
            intervals = _subtract(
                _normalize((*intervals, *staff_available)),
                staff_unavailable,
            )
            if intervals:
                resolved_staff.append(
                    ResolvedStaffCapacity(
                        staff_id=staff_id,
                        intervals=intervals,
                    )
                )

        available_minutes = sum(
            interval.minutes
            for staff_value in resolved_staff
            for interval in staff_value.intervals
        )
        total_slots = sum(
            interval.minutes // slot_duration
            for staff_value in resolved_staff
            for interval in staff_value.intervals
        )

        return AuthoritativeCapacityResult(
            owner_id=owner,
            period_start=start,
            period_end=end,
            slot_duration_minutes=slot_duration,
            active_staff_count=len(resolved_staff),
            available_minutes=available_minutes,
            total_slots=total_slots,
            staff_capacity=tuple(resolved_staff),
            blocked_period_count=blocked_period_count,
            holiday_closure_count=holiday_closure_count,
            availability_override_count=(
                availability_override_count
            ),
        )
