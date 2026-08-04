"""Deterministic privacy guards for structured observability fields."""

from __future__ import annotations

import math
import re
from collections.abc import Mapping, Sequence
from typing import Any

REDACTED = "[REDACTED]"
MAX_STRING_LENGTH = 256
MAX_COLLECTION_ITEMS = 32
MAX_DEPTH = 4

_SENSITIVE_KEY_PARTS = (
    "authorization",
    "password",
    "passwd",
    "secret",
    "token",
    "cookie",
    "session",
    "email",
    "phone",
    "address",
    "full_name",
    "firstname",
    "lastname",
    "first_name",
    "last_name",
)

_CONTROL_CHARACTERS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def is_sensitive_key(key: str) -> bool:
    normalized = key.strip().lower().replace("-", "_")
    return any(part in normalized for part in _SENSITIVE_KEY_PARTS)


def sanitize_string(value: str) -> str:
    cleaned = _CONTROL_CHARACTERS.sub("", value)
    if len(cleaned) <= MAX_STRING_LENGTH:
        return cleaned
    return f"{cleaned[:MAX_STRING_LENGTH]}…"


def sanitize_value(value: Any, *, depth: int = 0) -> Any:
    """Convert values into bounded JSON-safe observability primitives."""

    if depth >= MAX_DEPTH:
        return f"[{type(value).__name__}]"

    if value is None or isinstance(value, (bool, int)):
        return value

    if isinstance(value, float):
        return value if math.isfinite(value) else str(value)

    if isinstance(value, str):
        return sanitize_string(value)

    if isinstance(value, Mapping):
        return sanitize_mapping(value, depth=depth + 1)

    if isinstance(value, Sequence) and not isinstance(
        value,
        (str, bytes, bytearray),
    ):
        return [
            sanitize_value(item, depth=depth + 1)
            for item in list(value)[:MAX_COLLECTION_ITEMS]
        ]

    return f"[{type(value).__name__}]"


def sanitize_mapping(
    values: Mapping[str, Any],
    *,
    depth: int = 0,
) -> dict[str, Any]:
    """Redact sensitive keys and bound nested structured values."""

    sanitized: dict[str, Any] = {}

    for raw_key, value in list(values.items())[:MAX_COLLECTION_ITEMS]:
        key = sanitize_string(str(raw_key))

        if is_sensitive_key(key):
            sanitized[key] = REDACTED
        else:
            sanitized[key] = sanitize_value(value, depth=depth)

    return sanitized
