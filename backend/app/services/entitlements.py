from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.services.billing import PLAN_FEATURES


@dataclass(frozen=True, slots=True)
class FeatureEntitlementGrant:
    owner_id: str
    feature: str
    plan: str
    status: str


class FeatureNotEntitled(RuntimeError):
    def __init__(
        self,
        *,
        feature: str,
        reason_code: str,
    ) -> None:
        super().__init__("Feature is not entitled")
        self.feature = feature
        self.reason_code = reason_code


class EntitlementSourceUnavailable(RuntimeError):
    def __init__(
        self,
        *,
        feature: str,
        reason_code: str,
    ) -> None:
        super().__init__("Entitlement source is unavailable")
        self.feature = feature
        self.reason_code = reason_code


def _source_unavailable(
    *,
    feature: str,
    reason_code: str,
) -> EntitlementSourceUnavailable:
    return EntitlementSourceUnavailable(
        feature=feature,
        reason_code=reason_code,
    )


def _not_entitled(
    *,
    feature: str,
    reason_code: str,
) -> FeatureNotEntitled:
    return FeatureNotEntitled(
        feature=feature,
        reason_code=reason_code,
    )


async def require_feature_entitlement(
    *,
    database: Any,
    owner_id: str,
    feature: str,
) -> FeatureEntitlementGrant:
    # Resolve from authoritative local billing state only.
    normalized_owner = owner_id.strip() if isinstance(owner_id, str) else ""
    normalized_feature = feature.strip() if isinstance(feature, str) else ""

    if not normalized_owner:
        raise _source_unavailable(
            feature=normalized_feature or "unknown",
            reason_code="invalid_owner",
        )

    known_features = {
        item
        for features in PLAN_FEATURES.values()
        for item in features
    }
    if not normalized_feature or normalized_feature not in known_features:
        raise _source_unavailable(
            feature=normalized_feature or "unknown",
            reason_code="unknown_feature",
        )

    if database is None:
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="database_unavailable",
        )

    try:
        collection = database.subscriptions
        subscription = await collection.find_one(
            {"admin_id": normalized_owner}
        )
    except Exception as error:
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="billing_read_failed",
        ) from error

    if subscription is None:
        raise _not_entitled(
            feature=normalized_feature,
            reason_code="missing_subscription",
        )

    if not isinstance(subscription, Mapping):
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="malformed_subscription",
        )

    record_owner = subscription.get("admin_id")
    if record_owner != normalized_owner:
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="owner_binding_mismatch",
        )

    raw_plan = subscription.get("plan")
    raw_status = subscription.get("status")

    if not isinstance(raw_plan, str) or not raw_plan.strip():
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="malformed_plan",
        )
    if not isinstance(raw_status, str) or not raw_status.strip():
        raise _source_unavailable(
            feature=normalized_feature,
            reason_code="malformed_status",
        )

    plan = raw_plan.strip().lower()
    status = raw_status.strip().lower()

    if plan not in PLAN_FEATURES:
        raise _not_entitled(
            feature=normalized_feature,
            reason_code="unsupported_plan",
        )
    if status != "active":
        raise _not_entitled(
            feature=normalized_feature,
            reason_code="inactive_subscription",
        )
    if normalized_feature not in PLAN_FEATURES[plan]:
        raise _not_entitled(
            feature=normalized_feature,
            reason_code="feature_missing",
        )

    raw_expires_at = subscription.get("expires_at")
    if raw_expires_at is not None:
        if not isinstance(raw_expires_at, datetime):
            raise _source_unavailable(
                feature=normalized_feature,
                reason_code="malformed_expiration",
            )

        try:
            expires_at = (
                raw_expires_at.replace(tzinfo=UTC)
                if raw_expires_at.tzinfo is None
                else raw_expires_at.astimezone(UTC)
            )
        except Exception as error:
            raise _source_unavailable(
                feature=normalized_feature,
                reason_code="malformed_expiration",
            ) from error

        if expires_at <= datetime.now(UTC):
            raise _not_entitled(
                feature=normalized_feature,
                reason_code="expired_subscription",
            )

    return FeatureEntitlementGrant(
        owner_id=normalized_owner,
        feature=normalized_feature,
        plan=plan,
        status=status,
    )
