from __future__ import annotations

import asyncio
import inspect
import unittest
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI, HTTPException

from app.api import reports
from app.reports.models import (
    DailySummaryMetrics,
    DailySummaryReport,
)
from app.services.entitlements import (
    EntitlementSourceUnavailable,
    FeatureNotEntitled,
)


OWNER_ID = "6a43c75072c43ebd5355030b"


class ReportEntitlementContractTests(unittest.TestCase):
    def test_report_feature_constant_is_exact(self) -> None:
        self.assertEqual(reports.REPORT_FEATURE, "reports")

    def test_invalid_owner_fails_before_entitlement_resolution(self) -> None:
        entitlement = AsyncMock()

        with patch.object(
            reports,
            "require_feature_entitlement",
            entitlement,
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    reports.require_reports_entitlement(
                        auth={"admin_id": "not-an-object-id"},
                    )
                )

        self.assertEqual(caught.exception.status_code, 401)
        self.assertEqual(caught.exception.detail, "Invalid token")
        entitlement.assert_not_awaited()

    def test_report_entitlement_uses_server_authenticated_owner(self) -> None:
        database = object()
        entitlement = AsyncMock(return_value=None)

        with (
            patch.object(
                reports,
                "get_database",
                return_value=database,
            ),
            patch.object(
                reports,
                "require_feature_entitlement",
                entitlement,
            ),
        ):
            result = asyncio.run(
                reports.require_reports_entitlement(
                    auth={"admin_id": OWNER_ID},
                )
            )

        self.assertIsNone(result)
        entitlement.assert_awaited_once_with(
            database=database,
            owner_id=OWNER_ID,
            feature="reports",
        )

    def test_not_entitled_maps_to_403_without_reason_leak(self) -> None:
        entitlement = AsyncMock(
            side_effect=FeatureNotEntitled(
                feature="reports",
                reason_code="feature_missing",
            )
        )

        with (
            patch.object(
                reports,
                "get_database",
                return_value=object(),
            ),
            patch.object(
                reports,
                "require_feature_entitlement",
                entitlement,
            ),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    reports.require_reports_entitlement(
                        auth={"admin_id": OWNER_ID},
                    )
                )

        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(
            caught.exception.detail,
            {
                "code": "feature_not_entitled",
                "feature": "reports",
            },
        )

    def test_entitlement_source_unavailable_maps_to_503(self) -> None:
        entitlement = AsyncMock(
            side_effect=EntitlementSourceUnavailable(
                feature="reports",
                reason_code="database_unavailable",
            )
        )

        with (
            patch.object(
                reports,
                "get_database",
                return_value=None,
            ),
            patch.object(
                reports,
                "require_feature_entitlement",
                entitlement,
            ),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    reports.require_reports_entitlement(
                        auth={"admin_id": OWNER_ID},
                    )
                )

        self.assertEqual(caught.exception.status_code, 503)
        self.assertEqual(
            caught.exception.detail,
            {
                "code": "entitlement_source_unavailable",
                "feature": "reports",
            },
        )

    def test_route_signature_requires_auth_and_entitlement_dependencies(
        self,
    ) -> None:
        signature = inspect.signature(
            reports.export_daily_summary_pdf
        )
        self.assertIn("auth", signature.parameters)
        self.assertIn("_entitlement", signature.parameters)

        auth_default = signature.parameters["auth"].default
        entitlement_default = signature.parameters[
            "_entitlement"
        ].default

        self.assertIs(
            auth_default.dependency,
            reports.require_auth,
        )
        self.assertIs(
            entitlement_default.dependency,
            reports.require_reports_entitlement,
        )

    def test_openapi_contract_preserves_route_and_pdf_content_type(
        self,
    ) -> None:
        app = FastAPI()
        app.include_router(
            reports.router,
            prefix="/reports",
        )
        schema = app.openapi()

        operation = schema["paths"][
            "/reports/daily-summary/pdf"
        ]["get"]

        parameters = {
            item["name"]
            for item in operation["parameters"]
        }
        self.assertEqual(
            parameters,
            {"date", "locale", "authorization"},
        )

        parameter_map = {
            item["name"]: item
            for item in operation["parameters"]
        }
        self.assertEqual(
            parameter_map["authorization"]["in"],
            "header",
        )
        self.assertEqual(
            parameter_map["date"]["in"],
            "query",
        )
        self.assertEqual(
            parameter_map["locale"]["in"],
            "query",
        )
        self.assertNotIn("owner_id", parameter_map)

        responses = operation["responses"]
        self.assertIn("200", responses)
        self.assertIn(
            "application/pdf",
            responses["200"]["content"],
        )
        self.assertIn("400", responses)
        self.assertIn("401", responses)
        self.assertIn("403", responses)
        self.assertIn("503", responses)

    def test_pdf_route_uses_canonical_builder_and_preserves_response(
        self,
    ) -> None:
        report = DailySummaryReport(
            owner_id=OWNER_ID,
            report_date=date(2026, 8, 16),
            generated_at=datetime(
                2026,
                8,
                16,
                12,
                0,
                tzinfo=UTC,
            ),
            locale="en",
            metrics=DailySummaryMetrics(
                total_clients=2,
                total_services=3,
                total_appointments=4,
                appointments_on_date=0,
                scheduled_on_date=0,
                completed_on_date=0,
                cancelled_on_date=0,
            ),
            appointments=(),
        )
        builder = AsyncMock(return_value=report)
        database = object()

        with (
            patch.object(
                reports,
                "get_database",
                return_value=database,
            ),
            patch.object(
                reports,
                "build_daily_summary_report",
                builder,
            ),
        ):
            response = asyncio.run(
                reports.export_daily_summary_pdf(
                    date_str="2026-08-16",
                    locale="en",
                    auth={"admin_id": OWNER_ID},
                    _entitlement=None,
                )
            )

        builder.assert_awaited_once_with(
            database=database,
            owner_id=OWNER_ID,
            report_date=date(2026, 8, 16),
            locale="en",
        )

        self.assertEqual(
            response.media_type,
            "application/pdf",
        )
        self.assertEqual(
            response.headers["content-disposition"],
            'attachment; filename="salonflow_daily_summary_en_2026-08-16.pdf"',
        )

    def test_invalid_date_fails_before_report_builder(self) -> None:
        builder = AsyncMock()

        with (
            patch.object(
                reports,
                "get_database",
                return_value=object(),
            ),
            patch.object(
                reports,
                "build_daily_summary_report",
                builder,
            ),
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    reports.export_daily_summary_pdf(
                        date_str="16-08-2026",
                        locale="en",
                        auth={"admin_id": OWNER_ID},
                        _entitlement=None,
                    )
                )

        self.assertEqual(caught.exception.status_code, 400)
        builder.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
