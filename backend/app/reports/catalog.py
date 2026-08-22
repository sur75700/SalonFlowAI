from __future__ import annotations

from typing import Any

from app.reports.contracts import (
    BTC_SATOSHIS_PER_BTC,
    REPORT_EXPORT_ROW_LIMIT,
    REPORT_FIAT_CURRENCIES,
    REPORT_FORMATS_V2,
    REPORT_MARKET_ASSETS,
    REPORT_MAX_FILTER_VALUES,
    REPORT_MAX_RANGE_DAYS,
    REPORT_PREVIEW_ROW_LIMIT,
    REPORT_STATUS_VALUES,
    REPORT_TYPES,
)


_REPORT_CATALOG = (
    {
        "report_type": "daily-summary",
        "title_key": "reports.daily_summary.title",
        "period": "single_calendar_date",
        "filters": ["status", "client_id", "service_id"],
        "currency_mode": "not_applicable",
    },
    {
        "report_type": "appointments",
        "title_key": "reports.appointments.title",
        "period": "inclusive_calendar_date_range",
        "filters": ["status", "client_id", "service_id"],
        "currency_mode": "not_applicable",
    },
    {
        "report_type": "revenue-summary",
        "title_key": "reports.revenue_summary.title",
        "period": "inclusive_calendar_date_range",
        "filters": [],
        "currency_mode": "required_fiat",
    },
    {
        "report_type": "client-summary",
        "title_key": "reports.client_summary.title",
        "period": "inclusive_calendar_date_range",
        "filters": [],
        "currency_mode": "required_fiat",
    },
    {
        "report_type": "service-performance",
        "title_key": "reports.service_performance.title",
        "period": "inclusive_calendar_date_range",
        "filters": ["service_id"],
        "currency_mode": "required_fiat",
    },
    {
        "report_type": "capacity-utilization",
        "title_key": "reports.capacity_utilization.title",
        "period": "inclusive_calendar_date_range",
        "filters": [],
        "currency_mode": "not_applicable",
    },
)


def build_report_catalog() -> dict[str, Any]:
    return {
        "schema_version": 1,
        "report_types": [dict(item) for item in _REPORT_CATALOG],
        "formats": list(REPORT_FORMATS_V2),
        "limits": {
            "preview_rows": REPORT_PREVIEW_ROW_LIMIT,
            "export_rows": REPORT_EXPORT_ROW_LIMIT,
            "range_days": REPORT_MAX_RANGE_DAYS,
            "maximum_values_per_filter": REPORT_MAX_FILTER_VALUES,
        },
        "status_values": list(REPORT_STATUS_VALUES),
        "date_semantics": {
            "input": "YYYY-MM-DD",
            "range": "inclusive_local_calendar_dates",
            "mongo": "start_utc_inclusive_end_utc_exclusive",
            "daily_default": "owner_local_today_when_dates_omitted",
        },
        "money": {
            "fiat_report_currencies": list(REPORT_FIAT_CURRENCIES),
            "report_currency_semantics": (
                "explicit_original_currency_no_automatic_conversion"
            ),
            "market_assets": [
                {
                    "code": REPORT_MARKET_ASSETS[0],
                    "atomic_unit": "satoshi",
                    "atomic_units_per_asset": BTC_SATOSHIS_PER_BTC,
                    "report_currency": False,
                    "live_quotes": "deferred_dashboard",
                }
            ],
        },
        "saved_history": False,
        "report_type_count": len(REPORT_TYPES),
    }
