from __future__ import annotations

from app.observability.privacy import (
    MAX_COLLECTION_ITEMS,
    MAX_STRING_LENGTH,
    REDACTED,
    sanitize_mapping,
    sanitize_string,
    sanitize_value,
)


def test_sensitive_keys_are_redacted_recursively() -> None:
    result = sanitize_mapping(
        {
            "authorization": "Bearer secret",
            "customer_email": "user@example.test",
            "safe": {
                "session_token": "private",
                "status": "completed",
            },
        }
    )

    assert result["authorization"] == REDACTED
    assert result["customer_email"] == REDACTED
    assert result["safe"]["session_token"] == REDACTED
    assert result["safe"]["status"] == "completed"


def test_strings_are_control_cleaned_and_bounded() -> None:
    value = "\x00" + ("a" * (MAX_STRING_LENGTH + 20))
    sanitized = sanitize_string(value)

    assert "\x00" not in sanitized
    assert sanitized.endswith("…")
    assert len(sanitized) == MAX_STRING_LENGTH + 1


def test_collections_are_bounded_and_unknown_objects_are_not_repr_exposed() -> None:
    values = list(range(MAX_COLLECTION_ITEMS + 10))
    assert len(sanitize_value(values)) == MAX_COLLECTION_ITEMS

    class SensitiveObject:
        def __repr__(self) -> str:
            return "secret-value"

    assert sanitize_value(SensitiveObject()) == "[SensitiveObject]"


def test_non_finite_floats_are_json_safe() -> None:
    assert sanitize_value(float("inf")) == "inf"
    assert sanitize_value(float("-inf")) == "-inf"
