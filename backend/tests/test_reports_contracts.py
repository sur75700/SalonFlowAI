import unittest
from datetime import UTC, date, datetime, timedelta

from app.reports.catalog import build_report_catalog
from app.reports.contracts import (
    BTC_SATOSHIS_PER_BTC,
    REPORT_FIAT_CURRENCIES,
    REPORT_FORMATS_V2,
    REPORT_MARKET_ASSETS,
    REPORT_TYPES,
    ReportContractError,
    ReportDocument,
    ReportPeriod,
    normalize_report_currency,
    normalize_report_filters,
)


OWNER = "64b64c64b64c64b64c64b64c"


def period() -> ReportPeriod:
    return ReportPeriod(
        start_date=date(2026, 8, 17),
        end_date=date(2026, 8, 17),
        timezone="UTC",
        start_utc=datetime(2026, 8, 17, tzinfo=UTC),
        end_utc=datetime(2026, 8, 18, tzinfo=UTC),
    )


class ReportContractTests(unittest.TestCase):
    def test_catalog_freezes_six_types_five_formats_and_limits(self) -> None:
        catalog = build_report_catalog()
        self.assertEqual(tuple(REPORT_TYPES), tuple(
            item["report_type"] for item in catalog["report_types"]
        ))
        self.assertEqual(catalog["formats"], list(REPORT_FORMATS_V2))
        self.assertEqual(catalog["limits"]["preview_rows"], 100)
        self.assertEqual(catalog["limits"]["export_rows"], 10_000)
        self.assertEqual(catalog["limits"]["range_days"], 366)
        self.assertFalse(catalog["saved_history"])
        self.assertEqual(
            catalog["money"]["fiat_report_currencies"],
            list(REPORT_FIAT_CURRENCIES),
        )
        self.assertEqual(REPORT_MARKET_ASSETS, ("BTC",))
        self.assertEqual(BTC_SATOSHIS_PER_BTC, 100_000_000)
        self.assertFalse(
            catalog["money"]["market_assets"][0]["report_currency"]
        )

    def test_currency_contract_is_explicit_and_market_safe(self) -> None:
        self.assertEqual(
            normalize_report_currency(
                report_type="revenue-summary",
                currency="usd",
            ),
            "USD",
        )
        for currency in ("AMD", "USD", "EUR", "RUB"):
            self.assertEqual(
                normalize_report_currency(
                    report_type="service-performance",
                    currency=currency,
                ),
                currency,
            )

        with self.assertRaises(ReportContractError) as missing:
            normalize_report_currency(
                report_type="client-summary",
                currency=None,
            )
        self.assertEqual(missing.exception.code, "422_invalid_report_filter")

        with self.assertRaises(ReportContractError) as btc:
            normalize_report_currency(
                report_type="revenue-summary",
                currency="BTC",
            )
        self.assertEqual(btc.exception.code, "422_invalid_report_filter")

        with self.assertRaises(ReportContractError) as unsupported:
            normalize_report_currency(
                report_type="appointments",
                currency="AMD",
            )
        self.assertEqual(
            unsupported.exception.code,
            "422_unsupported_report_filter",
        )

    def test_filter_contract_validates_real_values(self) -> None:
        filters = normalize_report_filters(
            report_type="appointments",
            status=["scheduled", "completed"],
            client_id=[OWNER],
            service_id=["64b64c64b64c64b64c64b64d"],
        )
        self.assertEqual(filters.status, ("scheduled", "completed"))
        self.assertEqual(filters.client_id, (OWNER,))

        with self.assertRaises(ReportContractError) as invalid:
            normalize_report_filters(
                report_type="appointments",
                status=["invented"],
            )
        self.assertEqual(invalid.exception.code, "422_invalid_report_filter")

    def test_unsupported_filter_and_filter_limit_fail_closed(self) -> None:
        with self.assertRaises(ReportContractError) as unsupported:
            normalize_report_filters(
                report_type="revenue-summary",
                status=["completed"],
            )
        self.assertEqual(
            unsupported.exception.code,
            "422_unsupported_report_filter",
        )

        with self.assertRaises(ReportContractError) as too_many:
            normalize_report_filters(
                report_type="appointments",
                client_id=[OWNER] * 51,
            )
        self.assertEqual(
            too_many.exception.code,
            "422_invalid_report_filter",
        )

    def test_report_document_is_immutable_and_hides_owner(self) -> None:
        document = ReportDocument(
            owner_id=OWNER,
            report_type="appointments",
            title_key="reports.appointments.title",
            period=period(),
            locale="en",
            generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
            applied_filters={"status": ["scheduled"]},
            metrics={"appointments": 2},
            columns=("status",),
            rows=(("scheduled",), ("scheduled",)),
            warnings=(),
            total_rows=2,
        )
        public = document.public_dict(row_limit=1)
        self.assertNotIn("owner_id", public)
        self.assertEqual(len(public["rows"]), 1)
        self.assertEqual(public["total_rows"], 2)
        with self.assertRaises(TypeError):
            document.metrics["appointments"] = 3

    def test_report_period_requires_aware_positive_boundaries(self) -> None:
        with self.assertRaises(ValueError):
            ReportPeriod(
                start_date=date(2026, 8, 17),
                end_date=date(2026, 8, 17),
                timezone="UTC",
                start_utc=datetime(2026, 8, 17),
                end_utc=datetime(2026, 8, 18),
            )


if __name__ == "__main__":
    unittest.main()
