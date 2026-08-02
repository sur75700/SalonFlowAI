from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

from app.db.mongo import get_database
from app.intelligence.capacity import (
    CapacityDataUnavailable,
    CapacitySnapshot,
    require_capacity_baseline,
)
from app.intelligence.context import IntelligenceContext


_DEFAULT_WINDOW_DAYS = 30

_OCCUPYING_STATUSES = frozenset(
    {
        "completed",
        "scheduled",
    }
)


def _normalize_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _parse_timestamp(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return _normalize_utc(value)

    if not isinstance(value, str) or not value.strip():
        return None

    try:
        parsed = datetime.fromisoformat(
            value.strip().replace("Z", "+00:00")
        )
    except ValueError:
        return None

    return _normalize_utc(parsed)


def _window_bounds(
    context: IntelligenceContext,
) -> tuple[datetime, datetime]:
    """
    Return current-period start and exclusive end boundaries.
    """

    if context.window is not None:
        period_start = datetime.combine(
            context.window.start,
            time.min,
            tzinfo=UTC,
        )

        period_end = datetime.combine(
            context.window.end + timedelta(days=1),
            time.min,
            tzinfo=UTC,
        )
    else:
        period_end = _normalize_utc(
            context.generated_at
        )

        period_start = (
            period_end
            - timedelta(days=_DEFAULT_WINDOW_DAYS)
        )

    if period_end <= period_start:
        raise ValueError(
            "capacity analysis window must be positive"
        )

    return period_start, period_end


def _positive_integer(value: Any) -> int | None:
    if isinstance(value, bool):
        return None

    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None

    if (
        not parsed.is_finite()
        or parsed <= 0
        or parsed != parsed.to_integral_value()
    ):
        return None

    return int(parsed)


def _appointment_duration_minutes(
    item: dict[str, Any],
    *,
    starts_at: datetime,
) -> int:
    ends_at = _parse_timestamp(
        item.get("ends_at")
    )

    if ends_at is not None and ends_at > starts_at:
        duration_seconds = (
            ends_at - starts_at
        ).total_seconds()

        duration_minutes = int(
            duration_seconds // 60
        )

        if duration_minutes > 0:
            return duration_minutes

    snapshot_duration = _positive_integer(
        item.get("duration_minutes_snapshot")
    )

    return snapshot_duration or 0


def _validate_observed_capacity(
    *,
    total_slots: int,
    available_minutes: int,
    booked_slots: int,
    booked_minutes: int,
) -> None:
    """
    Reject stale or contradictory baselines.

    A zero-capacity baseline cannot truthfully describe a period
    where occupied appointments were observed.
    """

    if booked_slots > 0 and total_slots == 0:
        raise CapacityDataUnavailable(
            "capacity baseline has zero total slots "
            "despite observed bookings"
        )

    if booked_minutes > 0 and available_minutes == 0:
        raise CapacityDataUnavailable(
            "capacity baseline has zero available minutes "
            "despite observed booked time"
        )


class MongoCapacityProvider:
    async def get_capacity_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacitySnapshot:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        baseline = require_capacity_baseline(
            context
        )

        period_start, period_end = _window_bounds(
            context
        )

        if (
            baseline.period_start != period_start
            or baseline.period_end != period_end
        ):
            raise CapacityDataUnavailable(
                "capacity baseline period does not match "
                "analysis window"
            )

        db = get_database()

        if db is None:
            raise RuntimeError(
                "Database not connected"
            )

        query = {
            "owner_id": context.owner_id,
            "status": {
                "$in": sorted(
                    _OCCUPYING_STATUSES
                ),
            },
            "starts_at": {
                "$gte": period_start.isoformat(),
                "$lt": period_end.isoformat(),
            },
        }

        appointments = (
            await db.appointments
            .find(query)
            .sort("starts_at", 1)
            .to_list(length=5000)
        )

        booked_slots = 0
        completed_booking_count = 0
        booked_minutes = 0

        for item in appointments:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            status = str(
                item.get("status") or ""
            ).strip().lower()

            if status not in _OCCUPYING_STATUSES:
                continue

            starts_at = _parse_timestamp(
                item.get("starts_at")
            )

            if starts_at is None:
                continue

            if not (
                period_start
                <= starts_at
                < period_end
            ):
                continue

            booked_slots += 1

            if status == "completed":
                completed_booking_count += 1

            booked_minutes += (
                _appointment_duration_minutes(
                    item,
                    starts_at=starts_at,
                )
            )

        _validate_observed_capacity(
            total_slots=baseline.total_slots,
            available_minutes=(
                baseline.available_minutes
            ),
            booked_slots=booked_slots,
            booked_minutes=booked_minutes,
        )

        return CapacitySnapshot(
            owner_id=context.owner_id,
            period_start=period_start,
            period_end=period_end,
            total_slots=baseline.total_slots,
            booked_slots=booked_slots,
            completed_booking_count=(
                completed_booking_count
            ),
            active_staff_count=(
                baseline.active_staff_count
            ),
            available_minutes=(
                baseline.available_minutes
            ),
            booked_minutes=booked_minutes,
        )
