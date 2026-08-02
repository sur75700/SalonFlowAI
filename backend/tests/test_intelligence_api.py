import ast
import unittest
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch

from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import require_auth
from app.api.intelligence import (
    CAPACITY_SOURCE_LABEL,
    IntelligenceDecisionResponse,
    get_intelligence_service,
    router,
)
from app.intelligence.authoritative_capacity_source import (
    AUTHORITATIVE_CAPACITY_SOURCE,
    AuthoritativeCapacitySource,
)
from app.intelligence.capacity import (
    CapacityBaseline,
    CapacityDataUnavailable,
)
from app.intelligence.contracts import (
    Confidence,
    ConfidenceLevel,
    IntelligenceDecision,
)
from app.intelligence.service import IntelligenceService


OWNER = str(ObjectId())
GENERATED = datetime(2026, 7, 1, tzinfo=UTC)


def make_payload(**overrides):
    value = {
        "window": {
            "start": "2026-07-01",
            "end": "2026-07-01",
            "label": "current",
        },
        "currency": "usd",
    }
    value.update(overrides)
    return value


def make_decision(owner_id=OWNER):
    return IntelligenceDecision(
        owner_id=owner_id,
        summary="Capacity intelligence generated",
        signals=(),
        metrics=(),
        recommendations=(),
        confidence=Confidence(
            score=1.0,
            level=ConfidenceLevel.HIGH,
            explanation="Authoritative capacity resolved",
            evidence_count=0,
        ),
        generated_at=GENERATED,
    )


class RecordingService:
    def __init__(self):
        self.contexts = []
        self.result = make_decision()
        self.error = None

    async def analyze(self, *, context):
        self.contexts.append(context)
        if self.error:
            raise self.error
        return self.result


class IntelligenceApiTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router, prefix="/intelligence")
        self.service = RecordingService()
        self.app.dependency_overrides[require_auth] = lambda: {
            "admin_id": OWNER
        }
        self.app.dependency_overrides[get_intelligence_service] = (
            lambda: self.service
        )
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def post(self, body=None, database=object(), source_error=None):
        calls = []

        async def loader(instance, *, context):
            calls.append((instance, context))
            if source_error is not None:
                raise source_error
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
            return_value=database,
        ), patch.object(
            AuthoritativeCapacitySource,
            "get_capacity_baseline",
            new=loader,
        ):
            response = self.client.post(
                "/intelligence/decision",
                json=make_payload() if body is None else body,
            )
        return response, calls

    def test_openapi_has_no_capacity(self):
        schema = self.app.openapi()["components"]["schemas"][
            "IntelligenceDecisionRequest"
        ]
        self.assertEqual(
            sorted(schema["properties"]),
            ["currency", "window"],
        )
        self.assertEqual(schema["required"], ["window"])

    def test_capacity_schema_removed(self):
        schemas = self.app.openapi()["components"]["schemas"]
        self.assertNotIn("CapacityBaselineRequest", schemas)

    def test_capacity_field_forbidden(self):
        response, _ = self.post(
            make_payload(
                capacity={
                    "total_slots": 1,
                    "active_staff_count": 1,
                    "available_minutes": 60,
                }
            )
        )
        self.assertEqual(response.status_code, 422)

    def test_owner_id_forbidden(self):
        response, _ = self.post(make_payload(owner_id=OWNER))
        self.assertEqual(response.status_code, 422)

    def test_capacity_source_forbidden(self):
        response, _ = self.post(
            make_payload(capacity_source="client")
        )
        self.assertEqual(response.status_code, 422)

    def test_total_slots_forbidden(self):
        response, _ = self.post(make_payload(total_slots=1))
        self.assertEqual(response.status_code, 422)

    def test_available_minutes_forbidden(self):
        response, _ = self.post(
            make_payload(available_minutes=60)
        )
        self.assertEqual(response.status_code, 422)

    def test_active_staff_count_forbidden(self):
        response, _ = self.post(
            make_payload(active_staff_count=1)
        )
        self.assertEqual(response.status_code, 422)

    def test_authenticated_owner_used(self):
        response, _ = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.contexts[0].owner_id, OWNER)

    def test_source_resolved_once(self):
        response, calls = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(calls), 1)

    def test_baseline_attached(self):
        response, _ = self.post()
        self.assertEqual(response.status_code, 200)
        baselines = [
            value
            for value in self.service.contexts[0].metadata.values()
            if isinstance(value, CapacityBaseline)
        ]
        self.assertEqual(len(baselines), 1)
        self.assertEqual(
            baselines[0].source,
            AUTHORITATIVE_CAPACITY_SOURCE,
        )

    def test_server_source_label(self):
        self.assertEqual(
            CAPACITY_SOURCE_LABEL,
            "authoritative_capacity_v1",
        )

    def test_currency_normalized(self):
        response, _ = self.post(
            make_payload(currency="  eur  ")
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.contexts[0].currency, "EUR")

    def test_default_currency(self):
        body = make_payload()
        body.pop("currency")
        response, _ = self.post(body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.contexts[0].currency, "USD")

    def test_reversed_window_is_422(self):
        body = make_payload()
        body["window"]["start"] = "2026-07-03"
        response, _ = self.post(body)
        self.assertEqual(response.status_code, 422)

    def test_invalid_owner_is_401(self):
        self.app.dependency_overrides[require_auth] = lambda: {
            "admin_id": "invalid"
        }
        response, _ = self.post()
        self.assertEqual(response.status_code, 401)

    def test_database_unavailable_is_503(self):
        response, _ = self.post(database=None)
        self.assertEqual(response.status_code, 503)

    def test_capacity_unavailable_is_422(self):
        response, _ = self.post(
            source_error=CapacityDataUnavailable("missing")
        )
        self.assertEqual(response.status_code, 422)

    def test_cross_tenant_decision_is_500(self):
        self.service.result = make_decision(str(ObjectId()))
        response, _ = self.post()
        self.assertEqual(response.status_code, 500)

    def test_success_response_contract(self):
        response, _ = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.json()),
            {
                "owner_id",
                "summary",
                "signals",
                "metrics",
                "recommendations",
                "confidence",
                "generated_at",
            },
        )

    def test_explicit_response_model(self):
        route = next(
            route
            for route in self.app.routes
            if getattr(route, "path", None)
            == "/intelligence/decision"
        )
        self.assertIs(
            route.response_model,
            IntelligenceDecisionResponse,
        )

    def test_default_service_constructs(self):
        self.assertIsInstance(
            get_intelligence_service(),
            IntelligenceService,
        )

    def test_main_registers_intelligence(self):
        source = Path("app/main.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        rendered = [
            ast.unparse(node)
            for node in ast.walk(tree)
            if isinstance(node, ast.Call)
        ]
        self.assertTrue(
            any(
                "include_router(intelligence_router" in item
                for item in rendered
            )
        )

    def test_main_keeps_analytics(self):
        source = Path("app/main.py").read_text(encoding="utf-8")
        self.assertIn("analytics_router", source)

    def test_extra_window_field_forbidden(self):
        body = make_payload()
        body["window"]["owner_id"] = OWNER
        response, _ = self.post(body)
        self.assertEqual(response.status_code, 422)
