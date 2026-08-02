from __future__ import annotations

import hashlib
import json
from typing import Any

from pymongo.errors import CollectionInvalid

MIGRATION_ID = "0062a_authoritative_capacity_foundation"

_INTERVAL_SCHEMA = {
    "bsonType": "object",
    "required": ["start_minute", "end_minute"],
    "additionalProperties": False,
    "properties": {
        "start_minute": {
            "bsonType": "int",
            "minimum": 0,
            "maximum": 1439,
        },
        "end_minute": {
            "bsonType": "int",
            "minimum": 1,
            "maximum": 1440,
        },
    },
}

_BREAK_SCHEMA = dict(_INTERVAL_SCHEMA)

_BUSINESS_DAY_SCHEMA = {
    "bsonType": "object",
    "required": ["weekday", "intervals"],
    "additionalProperties": False,
    "properties": {
        "weekday": {
            "bsonType": "int",
            "minimum": 0,
            "maximum": 6,
        },
        "intervals": {
            "bsonType": "array",
            "maxItems": 8,
            "items": _INTERVAL_SCHEMA,
        },
    },
}

_SHIFT_SCHEMA = {
    "bsonType": "object",
    "required": [
        "start_minute",
        "end_minute",
        "breaks",
    ],
    "additionalProperties": False,
    "properties": {
        "start_minute": {
            "bsonType": "int",
            "minimum": 0,
            "maximum": 1439,
        },
        "end_minute": {
            "bsonType": "int",
            "minimum": 1,
            "maximum": 1440,
        },
        "breaks": {
            "bsonType": "array",
            "maxItems": 8,
            "items": _BREAK_SCHEMA,
        },
    },
}

_STAFF_DAY_SCHEMA = {
    "bsonType": "object",
    "required": ["weekday", "shifts"],
    "additionalProperties": False,
    "properties": {
        "weekday": {
            "bsonType": "int",
            "minimum": 0,
            "maximum": 6,
        },
        "shifts": {
            "bsonType": "array",
            "maxItems": 8,
            "items": _SHIFT_SCHEMA,
        },
    },
}

_PROFILE_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "owner_id",
            "schema_version",
            "revision",
            "status",
            "timezone",
            "slot_duration_minutes",
            "weekly_business_hours",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ],
        "properties": {
            "owner_id": {"bsonType": "string"},
            "schema_version": {"enum": [1]},
            "revision": {
                "bsonType": "int",
                "minimum": 1,
            },
            "status": {"enum": ["draft", "active"]},
            "timezone": {"bsonType": "string"},
            "slot_duration_minutes": {
                "bsonType": "int",
                "minimum": 5,
                "maximum": 120,
            },
            "weekly_business_hours": {
                "bsonType": "array",
                "maxItems": 7,
                "items": _BUSINESS_DAY_SCHEMA,
            },
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
            "created_by": {"bsonType": "string"},
            "updated_by": {"bsonType": "string"},
        },
    }
}

_STAFF_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "owner_id",
            "schema_version",
            "revision",
            "display_name",
            "is_active",
            "capacity_enabled",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ],
        "properties": {
            "owner_id": {"bsonType": "string"},
            "schema_version": {"enum": [1]},
            "revision": {
                "bsonType": "int",
                "minimum": 1,
            },
            "display_name": {"bsonType": "string"},
            "is_active": {"bsonType": "bool"},
            "capacity_enabled": {"bsonType": "bool"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
            "created_by": {"bsonType": "string"},
            "updated_by": {"bsonType": "string"},
        },
    }
}

_SCHEDULE_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "owner_id",
            "staff_id",
            "schema_version",
            "revision",
            "weekly_schedule",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ],
        "properties": {
            "owner_id": {"bsonType": "string"},
            "staff_id": {"bsonType": "objectId"},
            "schema_version": {"enum": [1]},
            "revision": {
                "bsonType": "int",
                "minimum": 1,
            },
            "weekly_schedule": {
                "bsonType": "array",
                "maxItems": 7,
                "items": _STAFF_DAY_SCHEMA,
            },
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
            "created_by": {"bsonType": "string"},
            "updated_by": {"bsonType": "string"},
        },
    }
}

_EXCEPTION_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "owner_id",
            "schema_version",
            "revision",
            "scope",
            "effect",
            "starts_at_utc",
            "ends_at_utc",
            "timezone_snapshot",
            "status",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ],
        "properties": {
            "owner_id": {"bsonType": "string"},
            "schema_version": {"enum": [1]},
            "revision": {
                "bsonType": "int",
                "minimum": 1,
            },
            "scope": {"enum": ["salon", "staff"]},
            "staff_id": {
                "bsonType": ["objectId", "null"],
            },
            "effect": {"enum": ["unavailable", "available"]},
            "starts_at_utc": {"bsonType": "date"},
            "ends_at_utc": {"bsonType": "date"},
            "timezone_snapshot": {"bsonType": "string"},
            "reason": {
                "bsonType": ["string", "null"],
            },
            "status": {"enum": ["active", "cancelled"]},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
            "created_by": {"bsonType": "string"},
            "updated_by": {"bsonType": "string"},
        },
    }
}


def _closed_validator(
    validator: dict[str, Any],
) -> dict[str, Any]:
    schema = dict(validator["$jsonSchema"])
    properties = dict(schema["properties"])
    properties["_id"] = {"bsonType": "objectId"}
    schema["properties"] = properties
    schema["additionalProperties"] = False
    return {"$jsonSchema": schema}


_PROFILE_VALIDATOR = _closed_validator(_PROFILE_VALIDATOR)
_STAFF_VALIDATOR = _closed_validator(_STAFF_VALIDATOR)
_SCHEDULE_VALIDATOR = _closed_validator(_SCHEDULE_VALIDATOR)
_EXCEPTION_VALIDATOR = _closed_validator(_EXCEPTION_VALIDATOR)

_COLLECTIONS = {
    "salon_capacity_profiles": _PROFILE_VALIDATOR,
    "staff_members": _STAFF_VALIDATOR,
    "staff_schedule_profiles": _SCHEDULE_VALIDATOR,
    "capacity_exceptions": _EXCEPTION_VALIDATOR,
}


_INDEXES = (
    {
        "collection": "salon_capacity_profiles",
        "keys": (("owner_id", 1),),
        "options": {
            "unique": True,
            "name": "uq_capacity_profile_owner",
        },
    },
    {
        "collection": "staff_members",
        "keys": (
            ("owner_id", 1),
            ("is_active", 1),
            ("capacity_enabled", 1),
        ),
        "options": {
            "name": "ix_staff_owner_active_capacity",
        },
    },
    {
        "collection": "staff_schedule_profiles",
        "keys": (
            ("owner_id", 1),
            ("staff_id", 1),
        ),
        "options": {
            "unique": True,
            "name": "uq_staff_schedule_owner_staff",
        },
    },
    {
        "collection": "capacity_exceptions",
        "keys": (
            ("owner_id", 1),
            ("status", 1),
            ("starts_at_utc", 1),
            ("ends_at_utc", 1),
        ),
        "options": {
            "name": "ix_capacity_exception_owner_range",
        },
    },
    {
        "collection": "capacity_exceptions",
        "keys": (
            ("owner_id", 1),
            ("staff_id", 1),
            ("status", 1),
            ("starts_at_utc", 1),
        ),
        "options": {
            "name": "ix_capacity_exception_staff_range",
        },
    },
    {
        "collection": "appointments",
        "keys": (
            ("owner_id", 1),
            ("status", 1),
            ("starts_at", 1),
        ),
        "options": {
            "name": "ix_appointment_owner_status_start",
        },
    },
)

MIGRATION_SPEC = {
    "collections": _COLLECTIONS,
    "indexes": _INDEXES,
    "schema_version": 1,
}

MIGRATION_CHECKSUM = hashlib.sha256(
    json.dumps(
        MIGRATION_SPEC,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
).hexdigest()


async def _ensure_collection(
    database: Any,
    *,
    name: str,
    validator: dict[str, Any],
) -> None:
    existing = set(await database.list_collection_names())
    if name not in existing:
        try:
            await database.create_collection(
                name,
                validator=validator,
                validationLevel="strict",
                validationAction="error",
            )
            return
        except CollectionInvalid:
            existing = set(await database.list_collection_names())
            if name not in existing:
                raise
    await database.command(
        {
            "collMod": name,
            "validator": validator,
            "validationLevel": "strict",
            "validationAction": "error",
        }
    )


async def apply_capacity_foundation(database: Any) -> None:
    for name, validator in _COLLECTIONS.items():
        await _ensure_collection(
            database,
            name=name,
            validator=validator,
        )

    for definition in _INDEXES:
        collection = database[
            str(definition["collection"])
        ]
        await collection.create_index(
            list(definition["keys"]),
            **dict(definition["options"]),
        )
