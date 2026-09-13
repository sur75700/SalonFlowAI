from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from math import ceil
from typing import Any, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.db.mongo import get_database


MAX_RENDER_BUCKETS = 240
MAX_AGGREGATE_ROWS = MAX_RENDER_BUCKETS * 2

SUPPORTED_PRESETS = frozenset(
    {
        "24h",
        "7d",
        "30d",
        "90d",
        "ytd",
        "1y",
        "all",
        "custom",
    }
)

SUPPORTED_CURRENCIES = frozenset(
    {
        "AMD",
        "USD",
        "EUR",
        "RUB",
    }
)

Granularity = Literal[
    "hour",
    "day",
    "week",
    "month",
    "quarter",
]


class RevenueTimeSeriesError(Exception):
    """Fail-closed trusted revenue time-series domain error."""

    def __init__(
        self,
        code: str,
        status_code: int = 422,
    ) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


@dataclass(frozen=True)
class ResolvedRange:
    start_local: datetime
    end_local: datetime
    start_utc: datetime
    end_utc: datetime
    previous_start_local: datetime
    previous_start_utc: datetime


def _normalize_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _normalize_currency(value: str) -> str:
    currency = str(value or "").strip().upper()

    if currency not in SUPPORTED_CURRENCIES:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_currency"
        )

    return currency


async def _resolve_timezone(
    *,
    database: Any,
    owner_id: str,
) -> tuple[str, str, tuple[str, ...]]:
    profile = await database.salon_capacity_profiles.find_one(
        {
            "owner_id": owner_id,
            "status": "active",
        }
    )

    candidate = (
        profile.get("timezone")
        if isinstance(profile, dict)
        else None
    )

    timezone_name = (
        candidate.strip()
        if isinstance(candidate, str)
        else ""
    )

    if timezone_name:
        try:
            ZoneInfo(timezone_name)

            return (
                timezone_name,
                "capacity_profile",
                (),
            )
        except (
            ZoneInfoNotFoundError,
            ValueError,
        ):
            pass

    return (
        "UTC",
        "utc_fallback",
        ("timezone_fallback_utc",),
    )


def _parse_custom_bound(
    value: str,
    *,
    timezone: ZoneInfo,
    is_end: bool,
) -> datetime:
    raw = str(value or "").strip()

    if not raw:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_range"
        )

    # Date-only bounds are owner-local calendar dates.
    # End date is inclusive, therefore represented internally
    # as the next local midnight and queried with a strict $lt.
    if (
        len(raw) == 10
        and raw[4:5] == "-"
        and raw[7:8] == "-"
    ):
        try:
            parsed_date = date.fromisoformat(raw)
        except ValueError as error:
            raise RevenueTimeSeriesError(
                "422_invalid_revenue_time_series_range"
            ) from error

        if is_end:
            parsed_date = parsed_date + timedelta(days=1)

        return datetime.combine(
            parsed_date,
            time.min,
            tzinfo=timezone,
        )

    try:
        parsed = datetime.fromisoformat(
            raw.replace("Z", "+00:00")
        )
    except ValueError as error:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_range"
        ) from error

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone)

    return parsed.astimezone(timezone)


def _one_year_before(value: datetime) -> datetime:
    try:
        return value.replace(year=value.year - 1)
    except ValueError:
        # Feb 29 -> Feb 28 in previous non-leap year.
        return value.replace(
            year=value.year - 1,
            month=2,
            day=28,
        )


def _resolve_range(
    *,
    preset: str,
    timezone: ZoneInfo,
    now_utc: datetime,
    earliest_trusted: datetime | None,
    date_from: str | None,
    date_to: str | None,
) -> ResolvedRange:
    selected = str(preset or "").strip().lower()

    if selected not in SUPPORTED_PRESETS:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_preset"
        )

    if selected != "custom" and (
        date_from is not None
        or date_to is not None
    ):
        raise RevenueTimeSeriesError(
            "422_revenue_time_series_range_only_custom"
        )

    local_now = _normalize_utc(
        now_utc
    ).astimezone(timezone)

    if selected == "24h":
        start_local = local_now - timedelta(hours=24)
        end_local = local_now

    elif selected == "7d":
        start_local = local_now - timedelta(days=7)
        end_local = local_now

    elif selected == "30d":
        start_local = local_now - timedelta(days=30)
        end_local = local_now

    elif selected == "90d":
        start_local = local_now - timedelta(days=90)
        end_local = local_now

    elif selected == "ytd":
        start_local = datetime(
            local_now.year,
            1,
            1,
            tzinfo=timezone,
        )
        end_local = local_now

    elif selected == "1y":
        start_local = _one_year_before(local_now)
        end_local = local_now

    elif selected == "all":
        if earliest_trusted is None:
            start_local = local_now
        else:
            start_local = _normalize_utc(
                earliest_trusted
            ).astimezone(timezone)

        end_local = local_now

    else:
        if date_from is None or date_to is None:
            raise RevenueTimeSeriesError(
                "422_invalid_revenue_time_series_range"
            )

        start_local = _parse_custom_bound(
            date_from,
            timezone=timezone,
            is_end=False,
        )

        end_local = _parse_custom_bound(
            date_to,
            timezone=timezone,
            is_end=True,
        )

    if end_local < start_local:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_range"
        )

    duration = end_local - start_local

    previous_start_local = (
        start_local - duration
        if duration > timedelta(0)
        else start_local
    )

    return ResolvedRange(
        start_local=start_local,
        end_local=end_local,
        start_utc=start_local.astimezone(UTC),
        end_utc=end_local.astimezone(UTC),
        previous_start_local=previous_start_local,
        previous_start_utc=previous_start_local.astimezone(UTC),
    )


def _select_granularity(
    start: datetime,
    end: datetime,
) -> tuple[Granularity, int]:
    seconds = max(
        0.0,
        (end - start).total_seconds(),
    )

    days = seconds / 86400

    if days <= 10:
        unit: Granularity = "hour"
        estimated = max(
            1,
            ceil(seconds / 3600),
        )

    elif days <= 240:
        unit = "day"
        estimated = max(
            1,
            ceil(days),
        )

    elif days <= 1680:
        unit = "week"
        estimated = max(
            1,
            ceil(days / 7),
        )

    elif days <= 7200:
        unit = "month"
        estimated = max(
            1,
            ceil(days / 30.4375),
        )

    else:
        unit = "quarter"
        estimated = max(
            1,
            ceil(days / 91.3125),
        )

    # Calendar alignment can create an edge bucket.
    # Keep a safety margin below the hard public ceiling.
    target = max(
        1,
        MAX_RENDER_BUCKETS - 2,
    )

    bin_size = max(
        1,
        ceil(estimated / target),
    )

    return unit, bin_size


def _earliest_pipeline(
    *,
    owner_id: str,
    currency: str,
) -> list[dict[str, Any]]:
    return [
        {
            "$match": {
                "owner_id": owner_id,
                "status": "completed",
                "currency_snapshot": currency,
            }
        },
        {
            "$sort": {
                "starts_at": 1,
            }
        },
        {
            "$set": {
                "_rts_starts_at": {
                    "$convert": {
                        "input": "$starts_at",
                        "to": "date",
                        "onError": None,
                        "onNull": None,
                    }
                },
                "_rts_price": {
                    "$convert": {
                        "input": "$price_snapshot",
                        "to": "decimal",
                        "onError": None,
                        "onNull": None,
                    }
                },
            }
        },
        {
            "$match": {
                "_rts_starts_at": {"$ne": None},
                "_rts_price": {
                    "$ne": None,
                    "$gte": 0,
                },
            }
        },
        {"$limit": 1},
        {
            "$project": {
                "_id": 0,
                "starts_at": "$_rts_starts_at",
            }
        },
    ]

async def _find_earliest_trusted(
    *,
    database: Any,
    owner_id: str,
    currency: str,
) -> datetime | None:
    cursor = database.appointments.aggregate(
        _earliest_pipeline(
            owner_id=owner_id,
            currency=currency,
        )
    )

    rows = await cursor.to_list(length=1)

    if not rows:
        return None

    value = rows[0].get("starts_at")

    if not isinstance(value, datetime):
        return None

    return _normalize_utc(value)


def _series_pipeline(
    *,
    owner_id: str,
    currency: str,
    timezone_name: str,
    query_start: datetime,
    current_start: datetime,
    current_end: datetime,
    granularity: Granularity,
    bin_size: int,
    compare: bool,
) -> list[dict[str, Any]]:
    query_start_text = _normalize_utc(
        query_start
    ).isoformat()

    current_end_text = _normalize_utc(
        current_end
    ).isoformat()

    date_trunc: dict[str, Any] = {
        "$dateTrunc": {
            "date": "$_rts_starts_at",
            "unit": granularity,
            "binSize": bin_size,
            "timezone": timezone_name,
        }
    }

    if granularity == "week":
        date_trunc["$dateTrunc"][
            "startOfWeek"
        ] = "monday"

    period_expression: Any = (
        {
            "$cond": [
                {
                    "$gte": [
                        "$_rts_starts_at",
                        current_start,
                    ]
                },
                "current",
                "comparison",
            ]
        }
        if compare
        else {"$literal": "current"}
    )

    return [
        {
            "$match": {
                "owner_id": owner_id,
                "status": "completed",
                "currency_snapshot": currency,
                "starts_at": {
                    "$gte": query_start_text,
                    "$lt": current_end_text,
                },
            }
        },
        {
            "$set": {
                "_rts_starts_at": {
                    "$convert": {
                        "input": "$starts_at",
                        "to": "date",
                        "onError": None,
                        "onNull": None,
                    }
                },
                "_rts_price": {
                    "$convert": {
                        "input": "$price_snapshot",
                        "to": "decimal",
                        "onError": None,
                        "onNull": None,
                    }
                },
            }
        },
        {
            "$match": {
                "_rts_starts_at": {
                    "$ne": None,
                    "$gte": query_start,
                    "$lt": current_end,
                },
                "_rts_price": {
                    "$ne": None,
                    "$gte": 0,
                },
            }
        },
        {
            "$set": {
                "_rts_period": period_expression,
                "_rts_bucket": date_trunc,
            }
        },
        {
            "$group": {
                "_id": {
                    "period": "$_rts_period",
                    "bucket": "$_rts_bucket",
                },
                "value": {
                    "$sum": "$_rts_price"
                },
                "completed_count": {
                    "$sum": 1
                },
            }
        },
        {
            "$set": {
                "bucket_end": {
                    "$dateAdd": {
                        "startDate": "$_id.bucket",
                        "unit": granularity,
                        "amount": bin_size,
                        "timezone": timezone_name,
                    }
                }
            }
        },
        {
            "$sort": {
                "_id.period": 1,
                "_id.bucket": 1,
            }
        },
        {
            "$project": {
                "_id": 0,
                "period": "$_id.period",
                "bucket_start": "$_id.bucket",
                "bucket_end": 1,
                "value": 1,
                "completed_count": 1,
            }
        },
    ]

async def _aggregate_rows(
    *,
    database: Any,
    owner_id: str,
    currency: str,
    timezone_name: str,
    resolved_range: ResolvedRange,
    granularity: Granularity,
    bin_size: int,
    compare: bool,
) -> list[dict[str, Any]]:
    query_start = (
        resolved_range.previous_start_utc
        if compare
        else resolved_range.start_utc
    )

    pipeline = _series_pipeline(
        owner_id=owner_id,
        currency=currency,
        timezone_name=timezone_name,
        query_start=query_start,
        current_start=resolved_range.start_utc,
        current_end=resolved_range.end_utc,
        granularity=granularity,
        bin_size=bin_size,
        compare=compare,
    )

    cursor = database.appointments.aggregate(
        pipeline
    )

    rows = await cursor.to_list(
        length=MAX_AGGREGATE_ROWS + 1
    )

    if len(rows) > MAX_AGGREGATE_ROWS:
        raise RevenueTimeSeriesError(
            "500_revenue_time_series_bucket_overflow",
            500,
        )

    current_count = sum(
        1
        for row in rows
        if row.get("period") == "current"
    )

    comparison_count = sum(
        1
        for row in rows
        if row.get("period") == "comparison"
    )

    if current_count > MAX_RENDER_BUCKETS:
        raise RevenueTimeSeriesError(
            "500_revenue_time_series_bucket_overflow",
            500,
        )

    if comparison_count > MAX_RENDER_BUCKETS:
        raise RevenueTimeSeriesError(
            "500_revenue_time_series_bucket_overflow",
            500,
        )

    return rows


def _currency_quantum(
    currency: str,
) -> Decimal:
    return (
        Decimal("1")
        if currency == "AMD"
        else Decimal("0.01")
    )


def _round_money(
    value: Any,
    *,
    currency: str = "AMD",
) -> float:
    try:
        amount = Decimal(
            str(value or 0)
        )
    except (
        InvalidOperation,
        ValueError,
    ):
        amount = Decimal("0")

    if not amount.is_finite():
        amount = Decimal("0")

    rounded = amount.quantize(
        _currency_quantum(currency),
        rounding=ROUND_HALF_UP,
    )

    return float(rounded)

def _as_utc_datetime(
    value: Any,
) -> datetime | None:
    if not isinstance(value, datetime):
        return None

    return _normalize_utc(value)


def _bucket_label(
    value: datetime,
    *,
    timezone: ZoneInfo,
    granularity: Granularity,
) -> str:
    local = value.astimezone(timezone)

    if granularity == "hour":
        return local.strftime(
            "%Y-%m-%d %H:%M"
        )

    if granularity in {
        "day",
        "week",
    }:
        return local.strftime(
            "%Y-%m-%d"
        )

    if granularity == "month":
        return local.strftime(
            "%Y-%m"
        )

    quarter = (
        (local.month - 1) // 3
    ) + 1

    return (
        f"{local.year}-Q{quarter}"
    )


def _point_from_row(
    row: dict[str, Any],
    *,
    timezone: ZoneInfo,
    granularity: Granularity,
    currency: str = "AMD",
) -> dict[str, Any] | None:
    start = _as_utc_datetime(
        row.get("bucket_start")
    )

    end = _as_utc_datetime(
        row.get("bucket_end")
    )

    if start is None or end is None:
        return None

    return {
        "bucket_start": start.isoformat(),
        "bucket_end": end.isoformat(),
        "label": _bucket_label(
            start,
            timezone=timezone,
            granularity=granularity,
        ),
        "value": _round_money(
            row.get("value"),
            currency=currency,
        ),
        "completed_count": max(
            0,
            int(
                row.get(
                    "completed_count"
                )
                or 0
            ),
        ),
    }


def _summary(
    *,
    current_series: list[dict[str, Any]],
    comparison_series: list[dict[str, Any]],
    compare: bool,
    currency: str = "AMD",
) -> dict[str, Any]:
    current_total = sum(
        Decimal(
            str(point["value"])
        )
        for point in current_series
    )

    previous_total = sum(
        Decimal(
            str(point["value"])
        )
        for point in comparison_series
    )

    completed_count = sum(
        int(
            point.get(
                "completed_count"
            )
            or 0
        )
        for point in current_series
    )

    delta = (
        current_total - previous_total
        if compare
        else Decimal("0")
    )

    delta_percent: float | None

    if (
        not compare
        or previous_total == 0
    ):
        delta_percent = None
    else:
        delta_percent = float(
            (
                delta
                / previous_total
                * Decimal("100")
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
        )

    return {
        "completed_revenue": _round_money(
            current_total,
            currency=currency,
        ),
        "previous_completed_revenue": (
            _round_money(
                previous_total,
                currency=currency,
            )
        ),
        "delta": _round_money(
            delta,
            currency=currency,
        ),
        "delta_percent": delta_percent,
        "completed_count": completed_count,
    }


async def build_revenue_time_series(
    *,
    owner_id: str,
    preset: str = "30d",
    date_from: str | None = None,
    date_to: str | None = None,
    currency: str = "AMD",
    compare: bool = True,
    now: datetime | None = None,
) -> dict[str, Any]:
    if (
        not isinstance(owner_id, str)
        or not owner_id.strip()
    ):
        raise RevenueTimeSeriesError(
            "401_invalid_owner_context",
            401,
        )

    selected_currency = (
        _normalize_currency(currency)
    )

    selected_preset = str(
        preset or ""
    ).strip().lower()

    if selected_preset not in SUPPORTED_PRESETS:
        raise RevenueTimeSeriesError(
            "422_invalid_revenue_time_series_preset"
        )

    database = get_database()

    if database is None:
        raise RevenueTimeSeriesError(
            "500_database_unavailable",
            500,
        )

    (
        timezone_name,
        timezone_source,
        warnings,
    ) = await _resolve_timezone(
        database=database,
        owner_id=owner_id,
    )

    timezone = ZoneInfo(
        timezone_name
    )

    earliest = await _find_earliest_trusted(
        database=database,
        owner_id=owner_id,
        currency=selected_currency,
    )

    reference_now = (
        _normalize_utc(now)
        if now is not None
        else datetime.now(UTC)
    )

    resolved_range = _resolve_range(
        preset=selected_preset,
        timezone=timezone,
        now_utc=reference_now,
        earliest_trusted=earliest,
        date_from=date_from,
        date_to=date_to,
    )

    granularity, bin_size = (
        _select_granularity(
            resolved_range.start_utc,
            resolved_range.end_utc,
        )
    )

    rows: list[dict[str, Any]] = []

    # Explicit contract: future-only ranges are valid and empty.
    future_only = (
        resolved_range.start_utc
        >= reference_now
    )

    if (
        not future_only
        and resolved_range.end_utc
        > resolved_range.start_utc
    ):
        rows = await _aggregate_rows(
            database=database,
            owner_id=owner_id,
            currency=selected_currency,
            timezone_name=timezone_name,
            resolved_range=resolved_range,
            granularity=granularity,
            bin_size=bin_size,
            compare=bool(compare),
        )

    current_series: list[
        dict[str, Any]
    ] = []

    comparison_series: list[
        dict[str, Any]
    ] = []

    for row in rows:
        point = _point_from_row(
            row,
            timezone=timezone,
            granularity=granularity,
            currency=selected_currency,
        )

        if point is None:
            continue

        period = row.get("period")

        if period == "comparison":
            if compare:
                comparison_series.append(
                    point
                )
            continue

        if period == "current":
            current_series.append(point)

    if len(current_series) > MAX_RENDER_BUCKETS:
        raise RevenueTimeSeriesError(
            "500_revenue_time_series_bucket_overflow",
            500,
        )

    if (
        len(comparison_series)
        > MAX_RENDER_BUCKETS
    ):
        raise RevenueTimeSeriesError(
            "500_revenue_time_series_bucket_overflow",
            500,
        )

    return {
        "contract_version": "1",
        "preset": selected_preset,
        "currency": selected_currency,
        "timezone": timezone_name,
        "timezone_source": timezone_source,
        "range": {
            "start_local": (
                resolved_range.start_local.isoformat()
            ),
            "end_local": (
                resolved_range.end_local.isoformat()
            ),
            "start_utc": (
                resolved_range.start_utc.isoformat()
            ),
            "end_utc": (
                resolved_range.end_utc.isoformat()
            ),
        },
        "granularity": granularity,
        "earliest_trusted_at": (
            earliest.isoformat()
            if earliest is not None
            else None
        ),
        "summary": _summary(
            current_series=current_series,
            comparison_series=(
                comparison_series
                if compare
                else []
            ),
            compare=bool(compare),
            currency=selected_currency,
        ),
        "series": current_series,
        "comparison_series": (
            comparison_series
            if compare
            else []
        ),
        "warnings": list(warnings),
    }
