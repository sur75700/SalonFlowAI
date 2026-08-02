from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import ValidationError

from app.capacity.repository import (
    CapacityNotFound,
    CapacityRepository,
)
from app.capacity.schemas import (
    CapacityExceptionCreateRequest,
    CapacityExceptionUpdateRequest,
    CapacityProfileUpsertRequest,
    StaffCreateRequest,
    StaffScheduleUpsertRequest,
    StaffUpdateRequest,
)
from app.capacity.validation import (
    CapacityConfigurationInvalid,
    CapacityValidationError,
    has_business_hours,
    has_staff_shifts,
    has_staffed_business_overlap,
    normalize_utc,
    validate_exception_request,
    validate_profile_request,
    validate_schedule_request,
    validate_timezone_name,
)


class CapacityService:
    def __init__(self, repository: CapacityRepository) -> None:
        if not isinstance(repository, CapacityRepository):
            raise TypeError("repository must be a CapacityRepository")
        self._repository = repository

    @staticmethod
    def _object_id(value: str, *, field_name: str) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise CapacityValidationError(
                f"{field_name} must be a valid ObjectId"
            )
        return ObjectId(value)

    async def get_configuration(
        self,
        *,
        owner_id: str,
    ) -> dict[str, Any] | None:
        return await self._repository.get_profile(
            owner_id=owner_id
        )

    async def save_configuration(
        self,
        *,
        owner_id: str,
        payload: CapacityProfileUpsertRequest,
    ) -> dict[str, Any]:
        validate_profile_request(payload)
        values = payload.model_dump(
            exclude={"revision"},
            mode="python",
        )
        values["timezone"] = validate_timezone_name(
            payload.timezone
        )
        if payload.status == "active":
            missing = await self._operational_missing(
                owner_id=owner_id,
                profile_values={
                    "schema_version": 1,
                    **values,
                },
            )
            if missing:
                raise CapacityConfigurationInvalid(missing)
        return await self._repository.save_profile(
            owner_id=owner_id,
            values=values,
            expected_revision=payload.revision,
        )

    async def get_readiness(
        self,
        *,
        owner_id: str,
    ) -> dict[str, Any]:
        profile = await self._repository.get_profile(
            owner_id=owner_id
        )
        if profile is None:
            return {
                "ready": False,
                "status": "not_configured",
                "missing": [
                    "salon_timezone",
                    "business_hours",
                    "active_staff",
                    "active_staff_schedule",
                    "profile_activation",
                ],
                "profile_revision": None,
            }

        profile_values = {
            "schema_version": profile.get("schema_version"),
            "status": profile.get("status"),
            "timezone": profile.get("timezone"),
            "slot_duration_minutes": profile.get(
                "slot_duration_minutes"
            ),
            "weekly_business_hours": profile.get(
                "weekly_business_hours"
            ),
        }
        missing = await self._operational_missing(
            owner_id=owner_id,
            profile_values=profile_values,
        )
        status = profile.get("status")
        if status != "active":
            missing.append("profile_activation")

        normalized = list(dict.fromkeys(missing))
        ready = not normalized
        if ready:
            readiness_status = "ready"
        elif status == "draft":
            readiness_status = "draft"
        else:
            readiness_status = "invalid"

        return {
            "ready": ready,
            "status": readiness_status,
            "missing": normalized,
            "profile_revision": profile.get("revision"),
        }

    async def _operational_missing(
        self,
        *,
        owner_id: str,
        profile_values: dict[str, Any],
    ) -> list[str]:
        missing: list[str] = []
        if profile_values.get("schema_version") != 1:
            missing.append("unsupported_schema_version")

        profile_payload: CapacityProfileUpsertRequest | None = None
        try:
            profile_payload = (
                CapacityProfileUpsertRequest.model_validate(
                    {
                        "status": profile_values.get("status"),
                        "timezone": profile_values.get("timezone"),
                        "slot_duration_minutes": profile_values.get(
                            "slot_duration_minutes"
                        ),
                        "weekly_business_hours": profile_values.get(
                            "weekly_business_hours"
                        ),
                    }
                )
            )
            validate_profile_request(profile_payload)
        except (ValidationError, CapacityValidationError):
            missing.append("configuration_invalid")

        try:
            timezone_name = profile_values.get("timezone")
            if not isinstance(timezone_name, str):
                raise CapacityValidationError("timezone is required")
            validate_timezone_name(timezone_name)
        except CapacityValidationError:
            missing.append("salon_timezone")

        hours = profile_values.get("weekly_business_hours")
        if not has_business_hours(hours):
            missing.append("business_hours")

        staff = await self._repository.list_capacity_staff(
            owner_id=owner_id
        )
        if not staff:
            missing.extend(
                ["active_staff", "active_staff_schedule"]
            )
            return missing

        if any(item.get("schema_version") != 1 for item in staff):
            missing.append("unsupported_schema_version")

        staff_ids = [item["_id"] for item in staff]
        schedules = (
            await self._repository.list_schedules_for_staff(
                owner_id=owner_id,
                staff_ids=staff_ids,
            )
        )
        schedule_map = {
            item.get("staff_id"): item
            for item in schedules
        }
        for staff_id in staff_ids:
            schedule = schedule_map.get(staff_id)
            if schedule is None:
                missing.append("active_staff_schedule")
                break
            if schedule.get("schema_version") != 1:
                missing.append("unsupported_schema_version")
                missing.append("active_staff_schedule")
                break

            try:
                schedule_payload = (
                    StaffScheduleUpsertRequest.model_validate(
                        {
                            "weekly_schedule": schedule.get(
                                "weekly_schedule"
                            )
                        }
                    )
                )
                validate_schedule_request(schedule_payload)
            except (ValidationError, CapacityValidationError):
                missing.append("active_staff_schedule")
                break

            if not has_staff_shifts(
                schedule_payload.model_dump(
                    mode="python"
                ).get("weekly_schedule")
            ):
                missing.append("active_staff_schedule")
                break

            if (
                profile_payload is not None
                and not has_staffed_business_overlap(
                    profile_payload.weekly_business_hours,
                    schedule_payload.weekly_schedule,
                )
            ):
                missing.append("active_staff_schedule")
                break
        return missing

    async def list_staff(
        self,
        *,
        owner_id: str,
    ) -> list[dict[str, Any]]:
        return await self._repository.list_staff(
            owner_id=owner_id
        )

    async def create_staff(
        self,
        *,
        owner_id: str,
        payload: StaffCreateRequest,
    ) -> dict[str, Any]:
        return await self._repository.create_staff(
            owner_id=owner_id,
            values=payload.model_dump(mode="python"),
        )

    async def update_staff(
        self,
        *,
        owner_id: str,
        staff_id: str,
        payload: StaffUpdateRequest,
    ) -> dict[str, Any]:
        object_id = self._object_id(
            staff_id,
            field_name="staff_id",
        )
        return await self._repository.update_staff(
            owner_id=owner_id,
            staff_id=object_id,
            values=payload.model_dump(
                exclude={"revision"},
                mode="python",
            ),
            expected_revision=payload.revision,
        )

    async def deactivate_staff(
        self,
        *,
        owner_id: str,
        staff_id: str,
        revision: int,
    ) -> dict[str, Any]:
        object_id = self._object_id(
            staff_id,
            field_name="staff_id",
        )
        return await self._repository.deactivate_staff(
            owner_id=owner_id,
            staff_id=object_id,
            expected_revision=revision,
        )

    async def get_schedule(
        self,
        *,
        owner_id: str,
        staff_id: str,
    ) -> dict[str, Any]:
        object_id = await self._require_staff(
            owner_id=owner_id,
            staff_id=staff_id,
        )
        schedule = await self._repository.get_schedule(
            owner_id=owner_id,
            staff_id=object_id,
        )
        if schedule is None:
            raise CapacityNotFound("staff schedule not found")
        return schedule

    async def save_schedule(
        self,
        *,
        owner_id: str,
        staff_id: str,
        payload: StaffScheduleUpsertRequest,
    ) -> dict[str, Any]:
        validate_schedule_request(payload)
        object_id = await self._require_staff(
            owner_id=owner_id,
            staff_id=staff_id,
        )
        schedule = payload.model_dump(
            exclude={"revision"},
            mode="python",
        )["weekly_schedule"]
        return await self._repository.save_schedule(
            owner_id=owner_id,
            staff_id=object_id,
            weekly_schedule=schedule,
            expected_revision=payload.revision,
        )

    async def list_exceptions(
        self,
        *,
        owner_id: str,
        starts_at_utc: datetime | None,
        ends_at_utc: datetime | None,
        staff_id: str | None,
        status: str | None,
    ) -> list[dict[str, Any]]:
        start = None
        end = None
        if starts_at_utc is not None:
            start = normalize_utc(
                starts_at_utc,
                field_name="starts_at_utc",
            )
        if ends_at_utc is not None:
            end = normalize_utc(
                ends_at_utc,
                field_name="ends_at_utc",
            )
        if start is not None and end is not None:
            if end <= start:
                raise CapacityValidationError(
                    "ends_at_utc must be later than starts_at_utc"
                )
        staff_object_id = None
        if staff_id is not None:
            staff_object_id = await self._require_staff(
                owner_id=owner_id,
                staff_id=staff_id,
            )
        return await self._repository.list_exceptions(
            owner_id=owner_id,
            starts_at_utc=start,
            ends_at_utc=end,
            staff_id=staff_object_id,
            status=status,
        )

    async def create_exception(
        self,
        *,
        owner_id: str,
        payload: CapacityExceptionCreateRequest,
    ) -> dict[str, Any]:
        starts_at, ends_at = validate_exception_request(payload)
        values = payload.model_dump(mode="python")
        values["starts_at_utc"] = starts_at
        values["ends_at_utc"] = ends_at
        values["timezone_snapshot"] = validate_timezone_name(
            payload.timezone_snapshot
        )
        if payload.staff_id is not None:
            values["staff_id"] = await self._require_staff(
                owner_id=owner_id,
                staff_id=payload.staff_id,
            )
        return await self._repository.create_exception(
            owner_id=owner_id,
            values=values,
        )

    async def update_exception(
        self,
        *,
        owner_id: str,
        exception_id: str,
        payload: CapacityExceptionUpdateRequest,
    ) -> dict[str, Any]:
        object_id = self._object_id(
            exception_id,
            field_name="exception_id",
        )
        starts_at, ends_at = validate_exception_request(payload)
        values = payload.model_dump(
            exclude={"revision"},
            mode="python",
        )
        values["starts_at_utc"] = starts_at
        values["ends_at_utc"] = ends_at
        values["timezone_snapshot"] = validate_timezone_name(
            payload.timezone_snapshot
        )
        if payload.staff_id is not None:
            values["staff_id"] = await self._require_staff(
                owner_id=owner_id,
                staff_id=payload.staff_id,
            )
        return await self._repository.update_exception(
            owner_id=owner_id,
            exception_id=object_id,
            values=values,
            expected_revision=payload.revision,
        )

    async def cancel_exception(
        self,
        *,
        owner_id: str,
        exception_id: str,
        revision: int,
    ) -> dict[str, Any]:
        object_id = self._object_id(
            exception_id,
            field_name="exception_id",
        )
        return await self._repository.cancel_exception(
            owner_id=owner_id,
            exception_id=object_id,
            expected_revision=revision,
        )

    async def _require_staff(
        self,
        *,
        owner_id: str,
        staff_id: str,
    ) -> ObjectId:
        object_id = self._object_id(
            staff_id,
            field_name="staff_id",
        )
        staff = await self._repository.get_staff(
            owner_id=owner_id,
            staff_id=object_id,
        )
        if staff is None:
            raise CapacityNotFound("staff member not found")
        return object_id
