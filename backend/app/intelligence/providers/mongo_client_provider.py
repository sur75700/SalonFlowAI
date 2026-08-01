from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, time, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from app.db.mongo import get_database
from app.intelligence.client_intelligence import ClientSnapshot
from app.intelligence.context import IntelligenceContext


_DEFAULT_WINDOW_DAYS = 30
_MAX_CLIENT_RECORDS = 5_000
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
    """
    Return selected-period start and exclusive end boundaries.
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
            "client analysis window must be positive"
        )

    return period_start, period_end


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


def _document_identifier(
    value: Any,
) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()

    return normalized or None


class MongoClientProvider:
    """
    Build selected-period client intelligence from Mongo facts.

    Activity, historical activity and monetary values are calculated
    only from completed appointments matching context.currency.

    High-value clients are current active clients whose positive
    completed revenue is at least the arithmetic mean of positive
    current active-client revenue.
    """

    async def get_client_snapshot(
        self,
        *,
        context: IntelligenceContext,
    ) -> ClientSnapshot:
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

        client_query = {
            "owner_id": context.owner_id,
        }

        client_documents = (
            await db.clients
            .find(client_query)
            .sort("created_at", 1)
            .to_list(
                length=_MAX_CLIENT_RECORDS + 1
            )
        )

        if (
            len(client_documents)
            > _MAX_CLIENT_RECORDS
        ):
            raise RuntimeError(
                "client collection exceeds supported "
                "intelligence limit"
            )

        client_ids: set[str] = set()
        new_client_ids: set[str] = set()

        for item in client_documents:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            client_id = _document_identifier(
                item.get("_id")
            )

            if client_id is None:
                continue

            client_ids.add(client_id)

            created_at = _parse_timestamp(
                item.get("created_at")
            )

            if (
                created_at is not None
                and period_start
                <= created_at
                < period_end
            ):
                new_client_ids.add(client_id)

        appointment_query = {
            "owner_id": context.owner_id,
            "status": "completed",
            "starts_at": {
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
                "client appointment history exceeds "
                "supported intelligence limit"
            )

        current_booking_counts: dict[str, int] = (
            defaultdict(int)
        )

        current_revenue_minor: dict[str, int] = (
            defaultdict(int)
        )

        historically_active_client_ids: set[str] = (
            set()
        )

        completed_booking_count = 0
        completed_revenue_minor = 0

        for item in appointment_documents:
            if (
                str(item.get("owner_id") or "")
                != context.owner_id
            ):
                continue

            status = str(
                item.get("status") or ""
            ).strip().lower()

            if status != "completed":
                continue

            client_id = _document_identifier(
                item.get("client_id")
            )

            if (
                client_id is None
                or client_id not in client_ids
            ):
                continue

            starts_at = _parse_timestamp(
                item.get("starts_at")
            )

            if (
                starts_at is None
                or starts_at >= period_end
            ):
                continue

            appointment_currency = str(
                item.get("currency_snapshot")
                or currency
            ).strip().upper()

            if appointment_currency != currency:
                continue

            if starts_at < period_start:
                historically_active_client_ids.add(
                    client_id
                )
                continue

            price_minor = _money_to_minor(
                item.get("price_snapshot"),
                currency=currency,
            )

            current_booking_counts[client_id] += 1
            current_revenue_minor[client_id] += (
                price_minor
            )

            completed_booking_count += 1
            completed_revenue_minor += price_minor

        active_client_ids = set(
            current_booking_counts
        )

        returning_client_ids = {
            client_id
            for client_id, booking_count
            in current_booking_counts.items()
            if booking_count >= 2
        }

        at_risk_client_ids = (
            historically_active_client_ids
            - active_client_ids
        )

        positive_revenues = tuple(
            revenue
            for client_id, revenue
            in current_revenue_minor.items()
            if (
                client_id in active_client_ids
                and revenue > 0
            )
        )

        high_value_client_count = 0

        if positive_revenues:
            average_revenue = (
                Decimal(sum(positive_revenues))
                / Decimal(len(positive_revenues))
            )

            high_value_client_count = sum(
                1
                for client_id in active_client_ids
                if (
                    current_revenue_minor.get(
                        client_id,
                        0,
                    )
                    > 0
                    and Decimal(
                        current_revenue_minor[
                            client_id
                        ]
                    )
                    >= average_revenue
                )
            )

        return ClientSnapshot(
            owner_id=context.owner_id,
            period_start=period_start,
            period_end=period_end,
            currency=currency,
            total_client_count=len(client_ids),
            new_client_count=len(new_client_ids),
            active_client_count=len(
                active_client_ids
            ),
            returning_client_count=len(
                returning_client_ids
            ),
            historically_active_client_count=len(
                historically_active_client_ids
            ),
            at_risk_client_count=len(
                at_risk_client_ids
            ),
            high_value_client_count=(
                high_value_client_count
            ),
            completed_booking_count=(
                completed_booking_count
            ),
            completed_revenue_minor=(
                completed_revenue_minor
            ),
        )
