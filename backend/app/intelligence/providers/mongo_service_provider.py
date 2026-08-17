from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from app.db.mongo import get_database
from app.intelligence.context import IntelligenceContext
from app.intelligence.models.windows import resolve_local_date_window_utc
from app.intelligence.service_intelligence import (
    ServicePerformanceSnapshot,
    ServiceSnapshot,
)


_DEFAULT_WINDOW_DAYS = 30
_MAX_SERVICE_RECORDS = 5_000
_MAX_APPOINTMENT_RECORDS = 5_000

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
) -> tuple[datetime, datetime]:
    """Return an aware UTC half-open period for service intelligence."""
    if context.window is not None:
        period_start, period_end = resolve_local_date_window_utc(
            start=context.window.start,
            end=context.window.end,
            timezone_name=context.timezone,
        )
    else:
        period_end = _normalize_utc(context.generated_at)
        period_start = period_end - timedelta(days=_DEFAULT_WINDOW_DAYS)

    if period_end <= period_start:
        raise ValueError("service analysis window must be positive")

    return period_start, period_end


def _document_identifier(value: Any) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()

    return normalized or None


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
    if isinstance(value, bool):
        return 0

    try:
        amount = Decimal(str(value))
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


class MongoServiceProvider:
    """
    Build selected-period service performance from Mongo facts.

    Current catalog records supply identity, configured price,
    duration and active state.

    Appointment-time snapshots supply immutable selected-period
    booking status and monetary contribution.
    """

    async def get_service_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> ServiceSnapshot:
        if not isinstance(context, IntelligenceContext):
            raise TypeError(
                "context must be an IntelligenceContext"
            )

        currency = context.currency.strip().upper()

        period_start, period_end = _window_bounds(
            context
        )

        db = get_database()

        if db is None:
            raise RuntimeError(
                "Database not connected"
            )

        service_query = {
            "owner_id": context.owner_id,
        }

        service_documents = (
            await db.services
            .find(service_query)
            .sort("name", 1)
            .to_list(
                length=_MAX_SERVICE_RECORDS + 1
            )
        )

        if len(service_documents) > _MAX_SERVICE_RECORDS:
            raise RuntimeError(
                "service collection exceeds supported "
                "intelligence limit"
            )

        aggregates: dict[str, dict[str, Any]] = {}

        for item in service_documents:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            service_id = _document_identifier(
                item.get("_id")
            )

            if service_id is None:
                continue

            service_currency = str(
                item.get("currency")
                or currency
            ).strip().upper()

            if service_currency != currency:
                continue

            if service_id in aggregates:
                raise RuntimeError(
                    "service catalog contains duplicate identifiers"
                )

            name = str(
                item.get("name") or ""
            ).strip()

            if not name:
                raise RuntimeError(
                    "service catalog contains an empty name"
                )

            is_active = item.get("is_active")

            if not isinstance(is_active, bool):
                raise RuntimeError(
                    "service catalog contains an invalid "
                    "active state"
                )

            duration_minutes = _positive_integer(
                item.get("duration_minutes")
            )

            if duration_minutes is None:
                raise RuntimeError(
                    "service catalog contains an invalid "
                    "duration"
                )

            aggregates[service_id] = {
                "service_id": service_id,
                "name": name,
                "catalog_present": True,
                "is_active": is_active,
                "duration_minutes": duration_minutes,
                "configured_price_minor": (
                    _money_to_minor(
                        item.get("price"),
                        currency=currency,
                    )
                ),
                "appointment_count": 0,
                "completed_booking_count": 0,
                "scheduled_booking_count": 0,
                "cancelled_booking_count": 0,
                "other_booking_count": 0,
                "completed_revenue_minor": 0,
                "scheduled_value_minor": 0,
                "cancelled_value_minor": 0,
            }

        appointment_query = {
            "owner_id": context.owner_id,
            "starts_at": {
                "$gte": period_start.isoformat(),
                "$lt": period_end.isoformat(),
            },
        }

        appointment_documents = (
            await db.appointments
            .find(appointment_query)
            .sort("starts_at", 1)
            .to_list(
                length=_MAX_APPOINTMENT_RECORDS + 1
            )
        )

        if (
            len(appointment_documents)
            > _MAX_APPOINTMENT_RECORDS
        ):
            raise RuntimeError(
                "service appointment history exceeds "
                "supported intelligence limit"
            )

        for item in appointment_documents:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            service_id = _document_identifier(
                item.get("service_id")
            )

            if service_id is None:
                continue

            starts_at = _parse_timestamp(
                item.get("starts_at")
            )

            if (
                starts_at is None
                or not (
                    period_start
                    <= starts_at
                    < period_end
                )
            ):
                continue

            appointment_currency = str(
                item.get("currency_snapshot")
                or currency
            ).strip().upper()

            if appointment_currency != currency:
                continue

            aggregate = aggregates.get(service_id)

            if aggregate is None:
                snapshot_name = str(
                    item.get("service_name")
                    or service_id
                ).strip() or service_id

                snapshot_duration = _positive_integer(
                    item.get(
                        "duration_minutes_snapshot"
                    )
                )

                aggregate = {
                    "service_id": service_id,
                    "name": snapshot_name,
                    "catalog_present": False,
                    "is_active": False,
                    "duration_minutes": (
                        snapshot_duration or 0
                    ),
                    "configured_price_minor": 0,
                    "appointment_count": 0,
                    "completed_booking_count": 0,
                    "scheduled_booking_count": 0,
                    "cancelled_booking_count": 0,
                    "other_booking_count": 0,
                    "completed_revenue_minor": 0,
                    "scheduled_value_minor": 0,
                    "cancelled_value_minor": 0,
                    "_historical_snapshot_at": (
                        starts_at
                    ),
                }

                aggregates[service_id] = aggregate

            elif not aggregate["catalog_present"]:
                previous_snapshot_at = aggregate.get(
                    "_historical_snapshot_at"
                )

                if (
                    not isinstance(
                        previous_snapshot_at,
                        datetime,
                    )
                    or starts_at >= previous_snapshot_at
                ):
                    snapshot_name = str(
                        item.get("service_name")
                        or ""
                    ).strip()

                    snapshot_duration = (
                        _positive_integer(
                            item.get(
                                "duration_minutes_snapshot"
                            )
                        )
                    )

                    if snapshot_name:
                        aggregate["name"] = (
                            snapshot_name
                        )

                    if snapshot_duration is not None:
                        aggregate[
                            "duration_minutes"
                        ] = snapshot_duration

                    aggregate[
                        "_historical_snapshot_at"
                    ] = starts_at

            status = str(
                item.get("status") or ""
            ).strip().lower()

            price_minor = _money_to_minor(
                item.get("price_snapshot"),
                currency=currency,
            )

            aggregate["appointment_count"] += 1

            if status == "completed":
                aggregate[
                    "completed_booking_count"
                ] += 1
                aggregate[
                    "completed_revenue_minor"
                ] += price_minor

            elif status == "scheduled":
                aggregate[
                    "scheduled_booking_count"
                ] += 1
                aggregate[
                    "scheduled_value_minor"
                ] += price_minor

            elif status == "cancelled":
                aggregate[
                    "cancelled_booking_count"
                ] += 1
                aggregate[
                    "cancelled_value_minor"
                ] += price_minor

            else:
                aggregate[
                    "other_booking_count"
                ] += 1

        performances = tuple(
            ServicePerformanceSnapshot(
                **{
                    key: value
                    for key, value in item.items()
                    if key
                    != "_historical_snapshot_at"
                }
            )
            for item in aggregates.values()
        )

        ranked_performances = tuple(
            sorted(
                performances,
                key=lambda item: (
                    -item.completed_revenue_minor,
                    -item.demand_booking_count,
                    -item.appointment_count,
                    item.name.casefold(),
                    item.service_id,
                ),
            )
        )

        active_service_count = sum(
            1
            for item in ranked_performances
            if item.is_active
        )

        return ServiceSnapshot(
            owner_id=context.owner_id,
            period_start=period_start,
            period_end=period_end,
            currency=currency,
            total_service_count=len(
                ranked_performances
            ),
            active_service_count=(
                active_service_count
            ),
            services=ranked_performances,
        )
