import unittest
from datetime import UTC, date, datetime
from io import BytesIO
from unittest.mock import AsyncMock, patch
from zipfile import ZipFile

from fastapi import FastAPI

from app.api import reports as reports_api
from app.reports.contracts import ReportDocument, ReportPeriod
from app.reports.renderers.csv import render_report_document_csv
from app.reports.renderers.docx import render_report_document_docx
from app.reports.renderers.pdf import render_report_document_pdf
from app.reports.renderers.txt import render_report_document_txt
from app.reports.renderers.xlsx import render_report_document_xlsx


OWNER = "64b64c64b64c64b64c64b64c"


def document() -> ReportDocument:
    return ReportDocument(
        owner_id=OWNER,
        report_type="appointments",
        title_key="reports.appointments.title",
        period=ReportPeriod(
            start_date=date(2026, 8, 17),
            end_date=date(2026, 8, 17),
            timezone="UTC",
            start_utc=datetime(2026, 8, 17, tzinfo=UTC),
            end_utc=datetime(2026, 8, 18, tzinfo=UTC),
        ),
        locale="en",
        generated_at=datetime(2026, 8, 17, 12, tzinfo=UTC),
        applied_filters={},
        metrics={"appointments": 1},
        columns=("client", "notes"),
        rows=(("=unsafe", "-formula"),),
        warnings=(),
        total_rows=1,
    )


class ReportOpenApiTests(unittest.IsolatedAsyncioTestCase):
    def test_openapi_has_exact_v2_routes_without_owner_parameter(self) -> None:
        app = FastAPI()
        app.include_router(reports_api.router, prefix="/reports")
        schema = app.openapi()
        paths = schema["paths"]

        self.assertIn("/reports/v2/catalog", paths)
        self.assertIn("/reports/v2/{report_type}/preview", paths)
        self.assertIn("/reports/v2/{report_type}/{format}", paths)

        for path in (
            "/reports/v2/{report_type}/preview",
            "/reports/v2/{report_type}/{format}",
        ):
            operation = paths[path]["get"]
            names = {
                item["name"]
                for item in operation.get("parameters", [])
            }
            self.assertNotIn("owner_id", names)
            self.assertTrue(
                {"start_date", "end_date", "locale", "currency"}.issubset(
                    names
                )
            )
            self.assertTrue(
                {401, 403, 413, 422, 503}.issubset(
                    {int(code) for code in operation["responses"]}
                )
            )

        export_operation = paths[
            "/reports/v2/{report_type}/{format}"
        ]["get"]
        export_content = export_operation["responses"]["200"]["content"]
        self.assertEqual(
            set(export_content),
            {
                "application/pdf",
                "text/plain",
                "text/csv",
                (
                    "application/vnd.openxmlformats-officedocument."
                    "spreadsheetml.sheet"
                ),
                (
                    "application/vnd.openxmlformats-officedocument."
                    "wordprocessingml.document"
                ),
            },
        )

    def test_all_v2_routes_require_auth_and_reports_entitlement(self) -> None:
        app = FastAPI()
        app.include_router(reports_api.router, prefix="/reports")
        expected = {
            "/reports/v2/catalog",
            "/reports/v2/{report_type}/preview",
            "/reports/v2/{report_type}/{format}",
        }
        checked = set()
        for route in app.routes:
            if getattr(route, "path", None) not in expected:
                continue
            calls = {
                dependency.call
                for dependency in route.dependant.dependencies
            }
            self.assertIn(reports_api.require_auth, calls)
            self.assertIn(
                reports_api.require_reports_entitlement,
                calls,
            )
            checked.add(route.path)
        self.assertEqual(checked, expected)

    def test_five_generic_renderers_smoke_and_formula_safety(self) -> None:
        report = document()
        pdf = render_report_document_pdf(report)
        txt = render_report_document_txt(report)
        csv = render_report_document_csv(report)
        xlsx = render_report_document_xlsx(report)
        docx = render_report_document_docx(report)

        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertIn("appointments", txt.decode("utf-8"))
        self.assertTrue(csv.startswith(b"\xef\xbb\xbf"))
        self.assertIn(b"'=unsafe", csv)
        self.assertIn(b"'-formula", csv)
        with ZipFile(BytesIO(xlsx)) as archive:
            self.assertIn("xl/workbook.xml", archive.namelist())
        with ZipFile(BytesIO(docx)) as archive:
            self.assertIn("word/document.xml", archive.namelist())

    async def test_export_builds_one_canonical_document_then_renders(self) -> None:
        report = document()
        build = AsyncMock(return_value=report)
        with patch.object(
            reports_api,
            "_build_report_v2",
            new=build,
        ):
            response = await reports_api.export_report_v2(
                report_type="appointments",
                format="txt",
                start_date="2026-08-17",
                end_date="2026-08-17",
                locale="en",
                status=None,
                client_id=None,
                service_id=None,
                currency=None,
                auth={"admin_id": OWNER},
                _entitlement=None,
            )
        build.assert_awaited_once()
        self.assertIn(
            "salonflow_appointments_2026-08-17_2026-08-17_en.txt",
            response.headers["content-disposition"],
        )


if __name__ == "__main__":
    unittest.main()
