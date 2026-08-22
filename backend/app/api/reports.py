from datetime import UTC, datetime
from io import BytesIO

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.reports import (
    DailySummaryReport,
    build_daily_summary_report,
)
from app.reports.renderers import (
    render_daily_summary_csv,
    render_daily_summary_docx,
    render_daily_summary_pdf,
    render_daily_summary_txt,
    render_daily_summary_xlsx,
)
from app.services.entitlements import (
    EntitlementSourceUnavailable,
    FeatureNotEntitled,
    require_feature_entitlement,
)

router = APIRouter()

REPORT_FEATURE = "reports"
FEATURE_NOT_ENTITLED_CODE = "feature_not_entitled"
ENTITLEMENT_SOURCE_UNAVAILABLE_CODE = "entitlement_source_unavailable"


def _authenticated_owner(auth: object) -> str:
    owner_id = (
        auth.get("admin_id")
        if isinstance(auth, dict)
        else None
    )
    if (
        not isinstance(owner_id, str)
        or not ObjectId.is_valid(owner_id)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )
    return owner_id


async def require_reports_entitlement(
    auth: dict = Depends(require_auth),
) -> None:
    owner_id = _authenticated_owner(auth)
    database = get_database()

    try:
        await require_feature_entitlement(
            database=database,
            owner_id=owner_id,
            feature=REPORT_FEATURE,
        )
    except FeatureNotEntitled:
        raise HTTPException(
            status_code=403,
            detail={
                "code": FEATURE_NOT_ENTITLED_CODE,
                "feature": REPORT_FEATURE,
            },
        ) from None
    except EntitlementSourceUnavailable:
        raise HTTPException(
            status_code=503,
            detail={
                "code": ENTITLEMENT_SOURCE_UNAVAILABLE_CODE,
                "feature": REPORT_FEATURE,
            },
        ) from None



REPORT_FORMATS = {
    "pdf": (render_daily_summary_pdf, "application/pdf", "pdf"),
    "txt": (render_daily_summary_txt, "text/plain", "txt"),
    "csv": (render_daily_summary_csv, "text/csv", "csv"),
    "xlsx": (
        render_daily_summary_xlsx,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsx",
    ),
    "docx": (
        render_daily_summary_docx,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx",
    ),
}


def _report_responses(*, media_type: str, description: str) -> dict:
    return {
        200: {"description": description, "content": {media_type: {}}},
        400: {"description": "Invalid report date"},
        401: {"description": "Authentication required"},
        403: {"description": "Reports feature not entitled"},
        503: {"description": "Report entitlement source unavailable"},
    }


async def _build_daily_summary(
    *,
    date_str: str | None,
    locale: str | None,
    auth: dict,
) -> DailySummaryReport:
    database = get_database()
    if database is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    owner_id = _authenticated_owner(auth)

    try:
        report_date = (
            datetime.strptime(date_str, "%Y-%m-%d").date()
            if date_str
            else datetime.now(UTC).date()
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD",
        ) from None

    return await build_daily_summary_report(
        database=database,
        owner_id=owner_id,
        report_date=report_date,
        locale=locale,
    )


def _stream_daily_summary(
    *,
    report: DailySummaryReport,
    format_name: str,
) -> StreamingResponse:
    renderer, media_type, extension = REPORT_FORMATS[format_name]
    payload = renderer(report)
    filename = (
        f"salonflow_daily_summary_{report.locale}_"
        f"{report.report_date.isoformat()}.{extension}"
    )
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        BytesIO(payload),
        media_type=media_type,
        headers=headers,
    )


async def _export_daily_summary(
    *,
    date_str: str | None,
    locale: str | None,
    auth: dict,
    format_name: str,
) -> StreamingResponse:
    report = await _build_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
    )
    return _stream_daily_summary(
        report=report,
        format_name=format_name,
    )


@router.get(
    "/daily-summary/pdf",
    responses=_report_responses(
        media_type="application/pdf",
        description="Daily summary PDF",
    ),
)
async def export_daily_summary_pdf(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    return await _export_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
        format_name="pdf",
    )


@router.get(
    "/daily-summary/txt",
    responses=_report_responses(
        media_type="text/plain",
        description="Daily summary TXT",
    ),
)
async def export_daily_summary_txt(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    return await _export_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
        format_name="txt",
    )


@router.get(
    "/daily-summary/csv",
    responses=_report_responses(
        media_type="text/csv",
        description="Daily summary CSV",
    ),
)
async def export_daily_summary_csv(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    return await _export_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
        format_name="csv",
    )


@router.get(
    "/daily-summary/xlsx",
    responses=_report_responses(
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        description="Daily summary XLSX",
    ),
)
async def export_daily_summary_xlsx(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    return await _export_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
        format_name="xlsx",
    )


@router.get(
    "/daily-summary/docx",
    responses=_report_responses(
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        description="Daily summary DOCX",
    ),
)
async def export_daily_summary_docx(
    date_str: str | None = Query(default=None, alias="date"),
    locale: str | None = Query(default="en"),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    return await _export_daily_summary(
        date_str=date_str,
        locale=locale,
        auth=auth,
        format_name="docx",
    )

# PHASE_63D_BACKEND_REPORT_CONTRACT_V2

from fastapi.responses import Response as _ReportV2Response  # noqa: E402

def _v2_report_responses(*, export: bool = False) -> dict:
    responses = {
        401: {"description": "Not authenticated"},
        403: {"description": "Reports feature not entitled"},
        413: {"description": "Report too large"},
        422: {"description": "Invalid report request"},
        503: {"description": "Report entitlement source unavailable"},
    }
    if export:
        responses[200] = {
            "description": "Canonical report export",
            "content": {
                "application/pdf": {},
                "text/plain": {},
                "text/csv": {},
                (
                    "application/vnd.openxmlformats-officedocument."
                    "spreadsheetml.sheet"
                ): {},
                (
                    "application/vnd.openxmlformats-officedocument."
                    "wordprocessingml.document"
                ): {},
            },
        }
    return responses


def _v2_raise_contract(error: Exception) -> None:
    status_code = getattr(error, "status_code", 500)
    code = getattr(error, "code", "report_contract_error")
    raise HTTPException(
        status_code=status_code,
        detail={"code": code},
    ) from None


async def _build_report_v2(
    *,
    report_type: str,
    start_date: str | None,
    end_date: str | None,
    locale: str | None,
    status: list[str] | None,
    client_id: list[str] | None,
    service_id: list[str] | None,
    currency: str | None,
    auth: dict,
):
    from app.reports.command_center import build_report_document
    from app.reports.contracts import (
        ReportContractError,
        normalize_report_filters,
    )

    owner_id = _authenticated_owner(auth)
    database = get_database()
    if database is None:
        raise HTTPException(
            status_code=500,
            detail="Database not connected",
        )

    try:
        filters = normalize_report_filters(
            report_type=report_type,
            status=status,
            client_id=client_id,
            service_id=service_id,
        )
        return await build_report_document(
            database=database,
            owner_id=owner_id,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            locale=locale,
            filters=filters,
            currency=currency,
        )
    except ReportContractError as error:
        _v2_raise_contract(error)


@router.get(
    "/v2/catalog",
    responses=_v2_report_responses(),
)
async def report_v2_catalog(
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
) -> dict:
    from app.reports.catalog import build_report_catalog

    _authenticated_owner(auth)
    return build_report_catalog()


@router.get(
    "/v2/{report_type}/preview",
    responses=_v2_report_responses(),
)
async def preview_report_v2(
    report_type: str,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    locale: str | None = Query(default="en"),
    status: list[str] | None = Query(default=None),
    client_id: list[str] | None = Query(default=None),
    service_id: list[str] | None = Query(default=None),
    currency: str | None = Query(default=None),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
) -> dict:
    from app.reports.contracts import REPORT_PREVIEW_ROW_LIMIT

    document = await _build_report_v2(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        locale=locale,
        status=status,
        client_id=client_id,
        service_id=service_id,
        currency=currency,
        auth=auth,
    )
    return document.public_dict(row_limit=REPORT_PREVIEW_ROW_LIMIT)


@router.get(
    "/v2/{report_type}/{format}",
    response_class=_ReportV2Response,
    responses=_v2_report_responses(export=True),
)
async def export_report_v2(
    report_type: str,
    format: str,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    locale: str | None = Query(default="en"),
    status: list[str] | None = Query(default=None),
    client_id: list[str] | None = Query(default=None),
    service_id: list[str] | None = Query(default=None),
    currency: str | None = Query(default=None),
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(require_reports_entitlement),
):
    from app.reports.contracts import (
        REPORT_FORMATS_V2,
        ReportContractError,
    )

    if format not in REPORT_FORMATS_V2:
        _v2_raise_contract(
            ReportContractError("422_invalid_report_filter", 422)
        )

    document = await _build_report_v2(
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        locale=locale,
        status=status,
        client_id=client_id,
        service_id=service_id,
        currency=currency,
        auth=auth,
    )

    if format == "pdf":
        from app.reports.renderers.pdf import render_report_document_pdf
        renderer = render_report_document_pdf
        media_type = "application/pdf"
    elif format == "txt":
        from app.reports.renderers.txt import render_report_document_txt
        renderer = render_report_document_txt
        media_type = "text/plain"
    elif format == "csv":
        from app.reports.renderers.csv import render_report_document_csv
        renderer = render_report_document_csv
        media_type = "text/csv"
    elif format == "xlsx":
        from app.reports.renderers.xlsx import render_report_document_xlsx
        renderer = render_report_document_xlsx
        media_type = (
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )
    else:
        from app.reports.renderers.docx import render_report_document_docx
        renderer = render_report_document_docx
        media_type = (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        )

    payload = renderer(document)
    filename = (
        f"salonflow_{document.report_type}_"
        f"{document.period.start_date.isoformat()}_"
        f"{document.period.end_date.isoformat()}_"
        f"{document.locale}.{format}"
    )
    return _ReportV2Response(
        content=payload,
        media_type=media_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )
