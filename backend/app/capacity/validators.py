from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Iterable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.capacity.schemas import (
    CapacityAuthoritativeFact,
    CapacityExceptionEffect,
    CapacityExceptionScope,
    CapacityExceptionStatus,
    capacity_authoritative_facts,
)


SUPPORTED_CAPACITY_SCHEMA_VERSION = 1


class CapacityFactValidationError(ValueError):
    """Raised when a persisted authoritative capacity fact is invalid."""


@dataclass(frozen=True, slots=True)
class CapacityExceptionFact:
    owner_id: str
    scope: CapacityExceptionScope
    staff_id: str | None
    effect: CapacityExceptionEffect
    status: CapacityExceptionStatus
    starts_at_utc: datetime
    ends_at_utc: datetime
    timezone_snapshot: str

    @property
    def authoritative_facts(
        self,
    ) -> tuple[CapacityAuthoritativeFact, ...]:
        return capacity_authoritative_facts(
            scope=self.scope,
            effect=self.effect,
        )

    @property
    def is_blocked_period(self) -> bool:
        return "blocked_periods" in self.authoritative_facts

    @property
    def is_holiday_or_closure(self) -> bool:
        return "holidays_closures" in self.authoritative_facts

    @property
    def is_availability_override(self) -> bool:
        return self.effect == "available"


def _required_text(value: Any, *, field_name: str) -> str:
    text = str(value).strip() if value is not None else ""
    if not text:
        raise CapacityFactValidationError(f"{field_name} is required")
    return text


def _utc_datetime(value: Any, *, field_name: str) -> datetime:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(
                value.strip().replace("Z", "+00:00")
            )
        except ValueError as error:
            raise CapacityFactValidationError(
                f"{field_name} must be an ISO datetime"
            ) from error

    if not isinstance(value, datetime):
        raise CapacityFactValidationError(
            f"{field_name} must be a datetime"
        )

    if value.tzinfo is None or value.utcoffset() is None:
        value = value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _timezone_snapshot(value: Any) -> str:
    name = _required_text(
        value,
        field_name="timezone_snapshot",
    )
    try:
        ZoneInfo(name)
    except ZoneInfoNotFoundError as error:
        raise CapacityFactValidationError(
            "timezone_snapshot must be a valid IANA timezone"
        ) from error
    return name


def validate_capacity_exception_document(
    document: dict[str, Any],
    *,
    owner_id: str,
) -> CapacityExceptionFact:
    """Normalize one tenant-owned persisted capacity exception."""

    if not isinstance(document, dict):
        raise CapacityFactValidationError(
            "capacity exception must be an object"
        )

    owner = _required_text(owner_id, field_name="owner_id")

    if document.get("schema_version") != SUPPORTED_CAPACITY_SCHEMA_VERSION:
        raise CapacityFactValidationError(
            "unsupported capacity exception schema version"
        )

    document_owner = _required_text(
        document.get("owner_id"),
        field_name="exception.owner_id",
    )
    if document_owner != owner:
        raise CapacityFactValidationError(
            "capacity exception owner does not match"
        )

    raw_scope = document.get("scope")
    if raw_scope not in ("salon", "staff"):
        raise CapacityFactValidationError(
            "capacity exception scope is invalid"
        )
    scope: CapacityExceptionScope = raw_scope

    raw_effect = document.get("effect")
    if raw_effect not in ("unavailable", "available"):
        raise CapacityFactValidationError(
            "capacity exception effect is invalid"
        )
    effect: CapacityExceptionEffect = raw_effect

    raw_status = document.get("status")
    if raw_status not in ("active", "cancelled"):
        raise CapacityFactValidationError(
            "capacity exception status is invalid"
        )
    status: CapacityExceptionStatus = raw_status

    raw_staff_id = document.get("staff_id")
    staff_id = (
        _required_text(
            raw_staff_id,
            field_name="exception.staff_id",
        )
        if raw_staff_id is not None
        else None
    )
    if scope == "staff" and staff_id is None:
        raise CapacityFactValidationError(
            "staff_id is required for staff capacity facts"
        )
    if scope == "salon" and staff_id is not None:
        raise CapacityFactValidationError(
            "staff_id must be null for salon capacity facts"
        )

    starts_at = _utc_datetime(
        document.get("starts_at_utc"),
        field_name="starts_at_utc",
    )
    ends_at = _utc_datetime(
        document.get("ends_at_utc"),
        field_name="ends_at_utc",
    )
    if ends_at <= starts_at:
        raise CapacityFactValidationError(
            "ends_at_utc must be later than starts_at_utc"
        )

    return CapacityExceptionFact(
        owner_id=owner,
        scope=scope,
        staff_id=staff_id,
        effect=effect,
        status=status,
        starts_at_utc=starts_at,
        ends_at_utc=ends_at,
        timezone_snapshot=_timezone_snapshot(
            document.get("timezone_snapshot")
        ),
    )


def validate_capacity_exception_documents(
    documents: Iterable[dict[str, Any]],
    *,
    owner_id: str,
) -> tuple[CapacityExceptionFact, ...]:
    """Return active normalized facts or fail closed on any invalid record."""

    facts: list[CapacityExceptionFact] = []
    for document in documents:
        fact = validate_capacity_exception_document(
            document,
            owner_id=owner_id,
        )
        if fact.status == "active":
            facts.append(fact)
    return tuple(facts)
