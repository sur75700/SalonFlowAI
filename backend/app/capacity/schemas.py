from __future__ import annotations

from datetime import datetime
from typing import Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

CapacityProfileStatus = Literal["draft", "active"]
CapacityExceptionScope = Literal["salon", "staff"]
CapacityExceptionEffect = Literal["unavailable", "available"]
CapacityExceptionStatus = Literal["active", "cancelled"]
CapacityAuthoritativeFact = Literal[
    "blocked_periods",
    "holidays_closures",
]


def capacity_authoritative_facts(
    *,
    scope: CapacityExceptionScope,
    effect: CapacityExceptionEffect,
) -> tuple[CapacityAuthoritativeFact, ...]:
    """Name the authoritative facts represented by an exception."""

    if scope not in ("salon", "staff"):
        raise ValueError("capacity exception scope is invalid")
    if effect not in ("unavailable", "available"):
        raise ValueError("capacity exception effect is invalid")

    facts: list[CapacityAuthoritativeFact] = []
    if effect == "unavailable":
        facts.append("blocked_periods")
    if scope == "salon" and effect == "unavailable":
        facts.append("holidays_closures")
    return tuple(facts)


class TimeInterval(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start_minute: int = Field(ge=0, le=1439)
    end_minute: int = Field(ge=1, le=1440)

    @model_validator(mode="after")
    def validate_order(self) -> Self:
        if self.end_minute <= self.start_minute:
            raise ValueError(
                "interval end_minute must be later than start_minute"
            )
        return self


class BusinessDay(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weekday: int = Field(ge=0, le=6)
    intervals: list[TimeInterval] = Field(
        default_factory=list,
        max_length=8,
    )


class CapacityProfileUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    revision: int | None = Field(default=None, ge=1)
    status: CapacityProfileStatus = "draft"
    timezone: str = Field(min_length=1, max_length=128)
    slot_duration_minutes: int = Field(ge=5, le=120)
    weekly_business_hours: list[BusinessDay] = Field(
        default_factory=list,
        max_length=7,
    )

    @field_validator("timezone")
    @classmethod
    def normalize_timezone(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("timezone is required")
        return normalized


class StaffCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=1, max_length=120)
    is_active: bool = True
    capacity_enabled: bool = True

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("display_name is required")
        return normalized


class StaffUpdateRequest(StaffCreateRequest):
    revision: int = Field(ge=1)


class StaffShift(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start_minute: int = Field(ge=0, le=1439)
    end_minute: int = Field(ge=1, le=1440)
    breaks: list[TimeInterval] = Field(
        default_factory=list,
        max_length=8,
    )

    @model_validator(mode="after")
    def validate_order(self) -> Self:
        if self.end_minute <= self.start_minute:
            raise ValueError(
                "shift end_minute must be later than start_minute"
            )
        return self


class StaffScheduleDay(BaseModel):
    model_config = ConfigDict(extra="forbid")

    weekday: int = Field(ge=0, le=6)
    shifts: list[StaffShift] = Field(
        default_factory=list,
        max_length=8,
    )


class StaffScheduleUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    revision: int | None = Field(default=None, ge=1)
    weekly_schedule: list[StaffScheduleDay] = Field(
        default_factory=list,
        max_length=7,
    )


class CapacityExceptionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scope: CapacityExceptionScope
    staff_id: str | None = Field(
        default=None,
        min_length=24,
        max_length=24,
    )
    effect: CapacityExceptionEffect
    starts_at_utc: datetime
    ends_at_utc: datetime
    timezone_snapshot: str = Field(min_length=1, max_length=128)
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("timezone_snapshot")
    @classmethod
    def normalize_timezone_snapshot(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("timezone_snapshot is required")
        return normalized

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.split())
        return normalized or None

    @model_validator(mode="after")
    def validate_scope_and_period(self) -> Self:
        if self.scope == "staff" and self.staff_id is None:
            raise ValueError("staff_id is required for staff scope")
        if self.scope == "salon" and self.staff_id is not None:
            raise ValueError("staff_id must be null for salon scope")
        if self.starts_at_utc.tzinfo is None:
            raise ValueError("starts_at_utc must be timezone-aware")
        if self.ends_at_utc.tzinfo is None:
            raise ValueError("ends_at_utc must be timezone-aware")
        if self.ends_at_utc <= self.starts_at_utc:
            raise ValueError(
                "ends_at_utc must be later than starts_at_utc"
            )
        return self

    @property
    def authoritative_facts(
        self,
    ) -> tuple[CapacityAuthoritativeFact, ...]:
        return capacity_authoritative_facts(
            scope=self.scope,
            effect=self.effect,
        )


class CapacityExceptionUpdateRequest(
    CapacityExceptionCreateRequest,
):
    revision: int = Field(ge=1)
    status: CapacityExceptionStatus = "active"


class CapacityProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    schema_version: int
    revision: int
    status: CapacityProfileStatus
    timezone: str
    slot_duration_minutes: int
    weekly_business_hours: list[BusinessDay]
    created_at: datetime
    updated_at: datetime


class CapacityConfigurationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    configuration: CapacityProfileResponse | None


class StaffResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    schema_version: int
    revision: int
    display_name: str
    is_active: bool
    capacity_enabled: bool
    created_at: datetime
    updated_at: datetime


class StaffListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[StaffResponse]
    count: int


class StaffScheduleResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    staff_id: str
    schema_version: int
    revision: int
    weekly_schedule: list[StaffScheduleDay]
    created_at: datetime
    updated_at: datetime


class CapacityExceptionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    schema_version: int
    revision: int
    scope: CapacityExceptionScope
    staff_id: str | None
    effect: CapacityExceptionEffect
    starts_at_utc: datetime
    ends_at_utc: datetime
    timezone_snapshot: str
    reason: str | None
    status: CapacityExceptionStatus
    created_at: datetime
    updated_at: datetime

    @property
    def authoritative_facts(
        self,
    ) -> tuple[CapacityAuthoritativeFact, ...]:
        return capacity_authoritative_facts(
            scope=self.scope,
            effect=self.effect,
        )


class CapacityExceptionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CapacityExceptionResponse]
    count: int


class CapacityReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ready: bool
    status: Literal[
        "not_configured",
        "draft",
        "invalid",
        "ready",
    ]
    missing: list[str]
    profile_revision: int | None
