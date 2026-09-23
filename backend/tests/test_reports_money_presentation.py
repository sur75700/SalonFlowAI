from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from app.reports.contracts import ReportDocument, ReportPeriod
from app.reports.money_presentation import (
    build_report_money_presentation,
)


NOW = datetime(
    2026,
    9,
    23,
    20,
    0,
    tzinfo=UTC,
)


def valuation(
    target: str,
    rate: str,
    *,
    state: str = "fresh",
) -> dict[str, object]:
    return {
        "source_currency": "AMD",
        "valuation_currency": target,
        "target_per_source": rate,
        "state": state,
        "market_sources": ["CBA"],
        "source_timestamps": [
            NOW.isoformat()
        ],
        "market_generated_at":
            NOW.isoformat(),
        "semantics":
            "generation_time_market_valuation_not_transaction_fx",
        "is_market_asset":
            target == "BTC",
    }


def test_original_usd_minor_units_render_as_major_units() -> None:
    result = build_report_money_presentation(
        metrics={
            "currency": "USD",
            "gross_revenue_minor": 12345,
        },
        columns=(),
        rows=(),
        locale="en",
        valuation_metadata=None,
    )

    assert (
        result["public_metrics"][
            "gross_revenue_minor"
        ]
        == "123.45 USD"
    )


def test_amd_to_usd_projection() -> None:
    result = build_report_money_presentation(
        metrics={
            "currency": "AMD",
            "gross_revenue_minor": 1_835_000,
        },
        columns=(),
        rows=(),
        locale="en",
        valuation_metadata=valuation(
            "USD",
            "0.0025",
        ),
    )

    assert (
        result["public_metrics"][
            "gross_revenue_minor"
        ]
        == "4,587.50 USD"
    )

    assert (
        result["export_metrics"][
            "source_currency"
        ]
        == "AMD"
    )

    assert (
        result["export_metrics"][
            "reporting_currency"
        ]
        == "USD"
    )


def test_amd_to_btc_projection_uses_eight_decimals() -> None:
    result = build_report_money_presentation(
        metrics={
            "currency": "AMD",
            "gross_revenue_minor":
                40_000_000,
        },
        columns=(),
        rows=(),
        locale="en",
        valuation_metadata=valuation(
            "BTC",
            "0.000000025",
        ),
    )

    assert (
        result["public_metrics"][
            "gross_revenue_minor"
        ]
        == "1.00000000 BTC"
    )


def test_row_money_columns_are_projected() -> None:
    result = build_report_money_presentation(
        metrics={
            "currency": "AMD",
        },
        columns=(
            "service_name",
            "configured_price_minor",
        ),
        rows=(
            (
                "Haircut",
                25_000,
            ),
        ),
        locale="en",
        valuation_metadata=valuation(
            "USD",
            "0.0025",
        ),
    )

    assert result["public_rows"] == (
        (
            "Haircut",
            "62.50 USD",
        ),
    )


def test_stale_export_disclosure_is_explicit() -> None:
    result = build_report_money_presentation(
        metrics={
            "currency": "AMD",
            "gross_revenue_minor": 400,
        },
        columns=(),
        rows=(),
        locale="hy",
        valuation_metadata=valuation(
            "USD",
            "0.0025",
            state="stale",
        ),
    )

    assert (
        "valuation_warning"
        in result["export_metrics"]
    )

    assert (
        "պահված"
        in result["export_metrics"][
            "valuation_warning"
        ]
    )


def test_report_document_public_dict_uses_presentation() -> None:
    presentation = (
        build_report_money_presentation(
            metrics={
                "currency": "AMD",
                "gross_revenue_minor":
                    1_835_000,
            },
            columns=(),
            rows=(),
            locale="en",
            valuation_metadata=valuation(
                "USD",
                "0.0025",
            ),
        )
    )

    document = ReportDocument(
        owner_id="owner",
        report_type="revenue-summary",
        title_key=
            "reports.revenue_summary.title",
        period=ReportPeriod(
            start_date=date(
                2026,
                9,
                1,
            ),
            end_date=date(
                2026,
                9,
                23,
            ),
            timezone="UTC",
            start_utc=NOW,
            end_utc=NOW + timedelta(days=1),
        ),
        locale="en",
        generated_at=NOW,
        applied_filters={},
        metrics={
            "currency": "AMD",
            "gross_revenue_minor":
                1_835_000,
            "__presentation__":
                presentation,
        },
        columns=(),
        rows=(),
        warnings=(),
        total_rows=0,
    )

    public = document.public_dict()

    assert (
        public["metrics"][
            "gross_revenue_minor"
        ]
        == "4,587.50 USD"
    )

    assert (
        "__presentation__"
        not in public["metrics"]
    )
