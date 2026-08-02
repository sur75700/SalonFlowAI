import asyncio
import unittest
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import require_auth
from app.api.intelligence import (
    ENTITLEMENT_SOURCE_UNAVAILABLE_CODE,
    FEATURE_NOT_ENTITLED_CODE,
    INTELLIGENCE_FEATURE,
    get_intelligence_service,
    require_advanced_ai_entitlement,
    router,
)
from app.intelligence.authoritative_capacity_source import (
    AUTHORITATIVE_CAPACITY_SOURCE,
    AuthoritativeCapacitySource,
)
from app.intelligence.capacity import CapacityBaseline
from app.services.entitlements import (
    EntitlementSourceUnavailable,
    FeatureNotEntitled,
    require_feature_entitlement,
)

import test_intelligence_api as legacy


_UNSET = object()


def subscription(
    *,
    owner_id=legacy.OWNER,
    plan="enterprise",
    status="active",
    expires_at=None,
):
    return {
        "admin_id": owner_id,
        "plan": plan,
        "status": status,
        "provider": "internal",
        "source": "test",
        "expires_at": expires_at,
    }


class FakeSubscriptions:
    def __init__(self, record=None, error=None):
        self.record = record
        self.error = error
        self.queries = []

    async def find_one(self, query):
        self.queries.append(deepcopy(query))
        if self.error is not None:
            raise self.error
        return deepcopy(self.record)


class FakeDatabase:
    def __init__(self, record=None, error=None):
        self.subscriptions = FakeSubscriptions(record, error)


class EntitlementResolverTests(unittest.IsolatedAsyncioTestCase):
    async def test_enterprise_advanced_ai_allowed(self):
        database = FakeDatabase(subscription())
        grant = await require_feature_entitlement(
            database=database,
            owner_id=legacy.OWNER,
            feature=INTELLIGENCE_FEATURE,
        )
        self.assertEqual(grant.owner_id, legacy.OWNER)
        self.assertEqual(grant.plan, "enterprise")
        self.assertEqual(grant.feature, "advanced_ai")
        self.assertEqual(
            database.subscriptions.queries,
            [{"admin_id": legacy.OWNER}],
        )

    async def test_missing_subscription_denied(self):
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(None),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "missing_subscription",
        )

    async def test_inactive_subscription_denied(self):
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(status="inactive")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "inactive_subscription",
        )

    async def test_unsupported_plan_denied(self):
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(plan="unknown")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "unsupported_plan",
        )

    async def test_business_lacks_advanced_ai(self):
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(plan="business")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "feature_missing",
        )

    async def test_malformed_plan_is_source_unavailable(self):
        with self.assertRaises(
            EntitlementSourceUnavailable
        ) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(plan=None)
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "malformed_plan",
        )

    async def test_malformed_status_is_source_unavailable(self):
        with self.assertRaises(
            EntitlementSourceUnavailable
        ) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(status=None)
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "malformed_status",
        )

    async def test_billing_read_failure_is_source_unavailable(self):
        with self.assertRaises(
            EntitlementSourceUnavailable
        ) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    error=RuntimeError("database secret")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "billing_read_failed",
        )
        self.assertNotIn(
            "database secret",
            str(captured.exception),
        )

    async def test_cross_tenant_record_is_rejected(self):
        with self.assertRaises(
            EntitlementSourceUnavailable
        ) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(owner_id="other-owner")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "owner_binding_mismatch",
        )

    async def test_future_expiration_is_allowed(self):
        grant = await require_feature_entitlement(
            database=FakeDatabase(
                subscription(
                    expires_at=datetime.now(UTC)
                    + timedelta(hours=1)
                )
            ),
            owner_id=legacy.OWNER,
            feature=INTELLIGENCE_FEATURE,
        )
        self.assertEqual(grant.plan, "enterprise")

    async def test_expired_subscription_is_denied(self):
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(
                        expires_at=datetime.now(UTC)
                        - timedelta(seconds=1)
                    )
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "expired_subscription",
        )

    async def test_naive_expired_subscription_is_denied(self):
        naive_utc_expired = (
            datetime.now(UTC).replace(tzinfo=None)
            - timedelta(seconds=1)
        )
        with self.assertRaises(FeatureNotEntitled) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(expires_at=naive_utc_expired)
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "expired_subscription",
        )

    async def test_malformed_expiration_is_source_unavailable(self):
        with self.assertRaises(
            EntitlementSourceUnavailable
        ) as captured:
            await require_feature_entitlement(
                database=FakeDatabase(
                    subscription(expires_at="not-a-datetime")
                ),
                owner_id=legacy.OWNER,
                feature=INTELLIGENCE_FEATURE,
            )
        self.assertEqual(
            captured.exception.reason_code,
            "malformed_expiration",
        )


class IntelligenceEntitlementEndpointTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router, prefix="/intelligence")
        self.service = legacy.RecordingService()
        self.app.dependency_overrides[require_auth] = lambda: {
            "admin_id": legacy.OWNER
        }
        self.app.dependency_overrides[get_intelligence_service] = (
            lambda: self.service
        )
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def post(
        self,
        *,
        record=None,
        read_error=None,
        body=None,
        database=_UNSET,
    ):
        calls = []
        selected_database = (
            FakeDatabase(record, read_error)
            if database is _UNSET
            else database
        )

        async def loader(instance, *, context):
            calls.append((instance, context))
            return CapacityBaseline(
                owner_id=context.owner_id,
                period_start=instance.period_start,
                period_end=instance.period_end,
                total_slots=10,
                active_staff_count=2,
                available_minutes=960,
                source=AUTHORITATIVE_CAPACITY_SOURCE,
            )

        with patch(
            "app.api.intelligence.get_database",
            return_value=selected_database,
        ), patch.object(
            AuthoritativeCapacitySource,
            "get_capacity_baseline",
            new=loader,
        ):
            response = self.client.post(
                "/intelligence/decision",
                json=legacy.make_payload()
                if body is None
                else body,
            )

        return response, calls

    def test_entitled_owner_receives_200(self):
        response, calls = self.post(record=subscription())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(calls), 1)
        self.assertEqual(len(self.service.contexts), 1)

    def test_missing_subscription_is_stable_403(self):
        response, calls = self.post(record=None)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {
                "detail": {
                    "code": FEATURE_NOT_ENTITLED_CODE,
                    "feature": INTELLIGENCE_FEATURE,
                }
            },
        )
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_inactive_subscription_is_stable_403(self):
        response, calls = self.post(
            record=subscription(status="inactive")
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_billing_read_failure_is_stable_503(self):
        response, calls = self.post(
            read_error=RuntimeError("private billing detail")
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "detail": {
                    "code": ENTITLEMENT_SOURCE_UNAVAILABLE_CODE,
                    "feature": INTELLIGENCE_FEATURE,
                }
            },
        )
        self.assertNotIn(
            "private billing detail",
            response.text,
        )
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_database_unavailable_is_stable_503(self):
        response, calls = self.post(database=None)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_expired_subscription_is_stable_403(self):
        response, calls = self.post(
            record=subscription(
                expires_at=datetime.now(UTC)
                - timedelta(seconds=1)
            )
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {
                "detail": {
                    "code": FEATURE_NOT_ENTITLED_CODE,
                    "feature": INTELLIGENCE_FEATURE,
                }
            },
        )
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_malformed_expiration_is_stable_503(self):
        response, calls = self.post(
            record=subscription(expires_at="not-a-datetime")
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "detail": {
                    "code": ENTITLEMENT_SOURCE_UNAVAILABLE_CODE,
                    "feature": INTELLIGENCE_FEATURE,
                }
            },
        )
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_invalid_authenticated_owner_remains_401(self):
        self.app.dependency_overrides[require_auth] = lambda: {
            "admin_id": "invalid"
        }
        response, calls = self.post(record=subscription())
        self.assertEqual(response.status_code, 401)
        self.assertEqual(calls, [])
        self.assertEqual(self.service.contexts, [])

    def test_client_cannot_assert_plan(self):
        body = legacy.make_payload()
        body["plan"] = "enterprise"
        response, _ = self.post(
            record=subscription(),
            body=body,
        )
        self.assertEqual(response.status_code, 422)

    def test_denial_payload_contains_no_billing_secrets(self):
        response, _ = self.post(record=None)
        self.assertEqual(response.status_code, 403)
        rendered = response.text.lower()
        for forbidden in (
            "customer_id",
            "subscription_id",
            "payment",
            "stripe",
            "token",
        ):
            self.assertNotIn(forbidden, rendered)

    def test_dependency_allows_entitled_principal(self):
        async def invoke():
            with patch(
                "app.api.intelligence.get_database",
                return_value=FakeDatabase(subscription()),
            ):
                return await require_advanced_ai_entitlement(
                    {"admin_id": legacy.OWNER}
                )

        result = asyncio.run(invoke())
        self.assertIsNone(result)


class IntelligenceEntitlementStaticContractTests(unittest.TestCase):
    def test_route_uses_entitlement_dependency(self):
        import inspect

        module = __import__(
            "app.api.intelligence",
            fromlist=["create_intelligence_decision"],
        )
        source = inspect.getsource(
            module.create_intelligence_decision
        )
        self.assertIn(
            "require_advanced_ai_entitlement",
            source,
        )
        self.assertIn("Depends(require_auth)", source)

    def test_feature_code_is_advanced_ai(self):
        self.assertEqual(INTELLIGENCE_FEATURE, "advanced_ai")
