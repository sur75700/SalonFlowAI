from __future__ import annotations

from collections.abc import Awaitable
from datetime import UTC, datetime
from typing import Any, Literal, TypeVar

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import PyMongoError

from app.api.deps import require_auth
from app.capacity.repository import (
    CapacityConflict,
    CapacityNotFound,
    CapacityRepository,
    CapacityRepositoryError,
    CapacityRevisionConflict,
)
from app.capacity.schemas import (
    CapacityConfigurationResponse,
    CapacityExceptionCreateRequest,
    CapacityExceptionListResponse,
    CapacityExceptionResponse,
    CapacityExceptionUpdateRequest,
    CapacityProfileResponse,
    CapacityProfileUpsertRequest,
    CapacityReadinessResponse,
    StaffCreateRequest,
    StaffListResponse,
    StaffResponse,
    StaffScheduleResponse,
    StaffScheduleUpsertRequest,
    StaffUpdateRequest,
)
from app.capacity.service import CapacityService
from app.capacity.validation import (
    CapacityConfigurationInvalid,
    CapacityValidationError,
)
from app.db.mongo import get_database

router = APIRouter()
_Result = TypeVar("_Result")


def get_capacity_service() -> CapacityService:
    database = get_database()
    if database is None:
        raise HTTPException(
            status_code=503,
            detail="Capacity service unavailable",
        )
    return CapacityService(CapacityRepository(database))


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


def _utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


async def _resolve(
    operation: Awaitable[_Result],
) -> _Result:
    try:
        return await operation
    except CapacityConfigurationInvalid as error:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "capacity_configuration_required",
                "message": str(error),
                "missing": list(error.missing),
                "action": "configure_capacity",
            },
        ) from None
    except CapacityNotFound as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from None
    except (
        CapacityRevisionConflict,
        CapacityConflict,
    ) as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from None
    except CapacityValidationError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from None
    except (CapacityRepositoryError, PyMongoError):
        raise HTTPException(
            status_code=503,
            detail="Capacity service unavailable",
        ) from None


def _profile_response(
    document: dict[str, Any],
) -> CapacityProfileResponse:
    return CapacityProfileResponse(
        id=str(document["_id"]),
        schema_version=document["schema_version"],
        revision=document["revision"],
        status=document["status"],
        timezone=document["timezone"],
        slot_duration_minutes=(
            document["slot_duration_minutes"]
        ),
        weekly_business_hours=(
            document["weekly_business_hours"]
        ),
        created_at=_utc_datetime(document["created_at"]),
        updated_at=_utc_datetime(document["updated_at"]),
    )


def _staff_response(
    document: dict[str, Any],
) -> StaffResponse:
    return StaffResponse(
        id=str(document["_id"]),
        schema_version=document["schema_version"],
        revision=document["revision"],
        display_name=document["display_name"],
        is_active=document["is_active"],
        capacity_enabled=document["capacity_enabled"],
        created_at=_utc_datetime(document["created_at"]),
        updated_at=_utc_datetime(document["updated_at"]),
    )


def _schedule_response(
    document: dict[str, Any],
) -> StaffScheduleResponse:
    return StaffScheduleResponse(
        id=str(document["_id"]),
        staff_id=str(document["staff_id"]),
        schema_version=document["schema_version"],
        revision=document["revision"],
        weekly_schedule=document["weekly_schedule"],
        created_at=_utc_datetime(document["created_at"]),
        updated_at=_utc_datetime(document["updated_at"]),
    )


def _exception_response(
    document: dict[str, Any],
) -> CapacityExceptionResponse:
    staff_id = document.get("staff_id")
    return CapacityExceptionResponse(
        id=str(document["_id"]),
        schema_version=document["schema_version"],
        revision=document["revision"],
        scope=document["scope"],
        staff_id=(
            str(staff_id)
            if staff_id is not None
            else None
        ),
        effect=document["effect"],
        starts_at_utc=_utc_datetime(document["starts_at_utc"]),
        ends_at_utc=_utc_datetime(document["ends_at_utc"]),
        timezone_snapshot=document["timezone_snapshot"],
        reason=document.get("reason"),
        status=document["status"],
        created_at=_utc_datetime(document["created_at"]),
        updated_at=_utc_datetime(document["updated_at"]),
    )


@router.get(
    "/configuration",
    response_model=CapacityConfigurationResponse,
)
async def get_configuration(
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityConfigurationResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.get_configuration(owner_id=owner_id)
    )
    return CapacityConfigurationResponse(
        configuration=(
            _profile_response(document)
            if document is not None
            else None
        )
    )


@router.put(
    "/configuration",
    response_model=CapacityProfileResponse,
)
async def save_configuration(
    payload: CapacityProfileUpsertRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityProfileResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.save_configuration(
            owner_id=owner_id,
            payload=payload,
        )
    )
    return _profile_response(document)


@router.get(
    "/readiness",
    response_model=CapacityReadinessResponse,
)
async def get_readiness(
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityReadinessResponse:
    owner_id = _authenticated_owner(auth)
    result = await _resolve(
        service.get_readiness(owner_id=owner_id)
    )
    return CapacityReadinessResponse(**result)


@router.get(
    "/staff",
    response_model=StaffListResponse,
)
async def list_staff(
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffListResponse:
    owner_id = _authenticated_owner(auth)
    documents = await _resolve(
        service.list_staff(owner_id=owner_id)
    )
    items = [_staff_response(item) for item in documents]
    return StaffListResponse(items=items, count=len(items))


@router.post(
    "/staff",
    response_model=StaffResponse,
    status_code=201,
)
async def create_staff(
    payload: StaffCreateRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.create_staff(
            owner_id=owner_id,
            payload=payload,
        )
    )
    return _staff_response(document)


@router.put(
    "/staff/{staff_id}",
    response_model=StaffResponse,
)
async def update_staff(
    staff_id: str,
    payload: StaffUpdateRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.update_staff(
            owner_id=owner_id,
            staff_id=staff_id,
            payload=payload,
        )
    )
    return _staff_response(document)


@router.delete(
    "/staff/{staff_id}",
    response_model=StaffResponse,
)
async def deactivate_staff(
    staff_id: str,
    revision: int = Query(ge=1),
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.deactivate_staff(
            owner_id=owner_id,
            staff_id=staff_id,
            revision=revision,
        )
    )
    return _staff_response(document)


@router.get(
    "/staff/{staff_id}/schedule",
    response_model=StaffScheduleResponse,
)
async def get_staff_schedule(
    staff_id: str,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffScheduleResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.get_schedule(
            owner_id=owner_id,
            staff_id=staff_id,
        )
    )
    return _schedule_response(document)


@router.put(
    "/staff/{staff_id}/schedule",
    response_model=StaffScheduleResponse,
)
async def save_staff_schedule(
    staff_id: str,
    payload: StaffScheduleUpsertRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> StaffScheduleResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.save_schedule(
            owner_id=owner_id,
            staff_id=staff_id,
            payload=payload,
        )
    )
    return _schedule_response(document)


@router.get(
    "/exceptions",
    response_model=CapacityExceptionListResponse,
)
async def list_exceptions(
    starts_at_utc: datetime | None = Query(default=None),
    ends_at_utc: datetime | None = Query(default=None),
    staff_id: str | None = Query(default=None),
    status: Literal["active", "cancelled"] | None = Query(
        default=None
    ),
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityExceptionListResponse:
    owner_id = _authenticated_owner(auth)
    documents = await _resolve(
        service.list_exceptions(
            owner_id=owner_id,
            starts_at_utc=starts_at_utc,
            ends_at_utc=ends_at_utc,
            staff_id=staff_id,
            status=status,
        )
    )
    items = [
        _exception_response(item)
        for item in documents
    ]
    return CapacityExceptionListResponse(
        items=items,
        count=len(items),
    )


@router.post(
    "/exceptions",
    response_model=CapacityExceptionResponse,
    status_code=201,
)
async def create_exception(
    payload: CapacityExceptionCreateRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityExceptionResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.create_exception(
            owner_id=owner_id,
            payload=payload,
        )
    )
    return _exception_response(document)


@router.put(
    "/exceptions/{exception_id}",
    response_model=CapacityExceptionResponse,
)
async def update_exception(
    exception_id: str,
    payload: CapacityExceptionUpdateRequest,
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityExceptionResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.update_exception(
            owner_id=owner_id,
            exception_id=exception_id,
            payload=payload,
        )
    )
    return _exception_response(document)


@router.delete(
    "/exceptions/{exception_id}",
    response_model=CapacityExceptionResponse,
)
async def cancel_exception(
    exception_id: str,
    revision: int = Query(ge=1),
    auth: dict = Depends(require_auth),
    service: CapacityService = Depends(get_capacity_service),
) -> CapacityExceptionResponse:
    owner_id = _authenticated_owner(auth)
    document = await _resolve(
        service.cancel_exception(
            owner_id=owner_id,
            exception_id=exception_id,
            revision=revision,
        )
    )
    return _exception_response(document)
