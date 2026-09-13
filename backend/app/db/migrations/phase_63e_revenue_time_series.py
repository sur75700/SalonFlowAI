from __future__ import annotations

import hashlib
import json
from typing import Any


MIGRATION_ID = "phase_63e_revenue_time_series_index_v1"

_INDEXES = (
    {
        "collection": "appointments",
        "keys": (
            ("owner_id", 1),
            ("status", 1),
            ("currency_snapshot", 1),
            ("starts_at", 1),
        ),
        "options": {
            "name": "ix_appointment_owner_status_currency_start",
        },
    },
)

MIGRATION_SPEC = {
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


async def apply_revenue_time_series_index(
    database: Any,
) -> None:
    for definition in _INDEXES:
        collection = database[
            str(definition["collection"])
        ]

        await collection.create_index(
            list(definition["keys"]),
            **dict(definition["options"]),
        )
