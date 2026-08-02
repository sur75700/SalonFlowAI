from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from app.db.mongo import get_database
from app.intelligence.context import IntelligenceContext
from app.intelligence.provider import RevenueSnapshot


_DEFAULT_WINDOW_DAYS = 30

_ZERO_DECIMAL_CURRENCIES = frozenset(
    {
        "AMD",
        "CLP",
        "JPY",
        "KRW",
        "PYG",
        "VND",
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
) -> tuple[datetime, datetime, datetime]:
    """
    Return previous-period start, current-period start and
    current-period end. End boundaries are exclusive.
    """

    if context.window is not None:
        current_start = datetime.combine(
            context.window.start,
            time.min,
            tzinfo=UTC,
        )

        current_end = datetime.combine(
            context.window.end + timedelta(days=1),
            time.min,
            tzinfo=UTC,
        )
    else:
        current_end = _normalize_utc(
            context.generated_at
        )

        current_start = (
            current_end
            - timedelta(days=_DEFAULT_WINDOW_DAYS)
        )

    duration = current_end - current_start

    if duration <= timedelta(0):
        raise ValueError(
            "revenue analysis window must be positive"
        )

    previous_start = current_start - duration

    return (
        previous_start,
        current_start,
        current_end,
    )


def _currency_scale(currency: str) -> int:
    return (
        1
        if currency in _ZERO_DECIMAL_CURRENCIES
        else 100
    )


def _money_to_minor(
    value: Any,
    *,
    currency: str,
) -> int:
    try:
        amount = Decimal(str(value or 0))
    except (InvalidOperation, ValueError):
        return 0

    if not amount.is_finite() or amount < 0:
        return 0

    scaled = (
        amount
        * Decimal(_currency_scale(currency))
    ).quantize(
        Decimal("1"),
        rounding=ROUND_HALF_UP,
    )

    return int(scaled)


class MongoRevenueProvider:
    async def get_revenue_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> RevenueSnapshot:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        db = get_database()

        if db is None:
            raise RuntimeError("Database not connected")

        currency = context.currency.strip().upper()

        (
            previous_start,
            current_start,
            current_end,
        ) = _window_bounds(context)

        query = {
            "owner_id": context.owner_id,
            "status": "completed",
            "starts_at": {
                "$gte": previous_start.isoformat(),
                "$lt": current_end.isoformat(),
            },
        }

        appointments = (
            await db.appointments
            .find(query)
            .sort("starts_at", 1)
            .to_list(length=5000)
        )

        current_revenue_minor = 0
        previous_revenue_minor = 0
        current_completed_count = 0

        for item in appointments:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            if (
                str(item.get("status") or "").lower()
                != "completed"
            ):
                continue

            starts_at = _parse_timestamp(
                item.get("starts_at")
            )

            if starts_at is None:
                continue

            appointment_currency = str(
                item.get("currency_snapshot")
                or currency
            ).strip().upper()

            if appointment_currency != currency:
                continue

            price_minor = _money_to_minor(
                item.get("price_snapshot"),
                currency=currency,
            )

            if current_start <= starts_at < current_end:
                current_revenue_minor += price_minor
                current_completed_count += 1
                continue

            if previous_start <= starts_at < current_start:
                previous_revenue_minor += price_minor

        average_ticket_minor = (
            int(
                (
                    Decimal(current_revenue_minor)
                    / Decimal(current_completed_count)
                ).quantize(
                    Decimal("1"),
                    rounding=ROUND_HALF_UP,
                )
            )
            if current_completed_count
            else 0
        )

        return RevenueSnapshot(
            owner_id=context.owner_id,
            period_start=current_start,
            period_end=current_end,
            currency=currency,
            completed_booking_count=(
                current_completed_count
            ),
            gross_revenue_minor=(
                current_revenue_minor
            ),
            previous_gross_revenue_minor=(
                previous_revenue_minor
            ),
            average_ticket_minor=(
                average_ticket_minor
            ),
        )
