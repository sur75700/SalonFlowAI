import unittest
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import require_auth
from app.api.intelligence import (
    CAPACITY_SOURCE_LABEL,
    IntelligenceDecisionResponse,
    get_intelligence_service,
    router,
)
from app.intelligence.capacity import (
    CAPACITY_BASELINE_METADATA_KEY,
    CapacityBaseline,
    CapacityDataUnavailable,
)
from app.intelligence.context import (
    IntelligenceContext,
)
from app.intelligence.contracts import (
    Confidence,
    ConfidenceLevel,
    IntelligenceDecision,
)
from app.intelligence.factory import (
    create_provider_family_intelligence_service,
)
from app.intelligence.service import (
    IntelligenceService,
)
from app.main import app as production_app


OWNER_ID = "64b000000000000000000001"
OTHER_OWNER_ID = "64b000000000000000000002"


def request_payload() -> dict:
    return {
        "currency": " amd ",
        "window": {
            "start": "2026-07-01",
            "end": "2026-07-07",
            "label": " weekly ",
        },
        "capacity": {
            "total_slots": 10,
            "active_staff_count": 2,
            "available_minutes": 960,
        },
    }


def make_decision(
    *,
    owner_id: str,
    generated_at: datetime | None = None,
) -> IntelligenceDecision:
    return IntelligenceDecision(
        owner_id=owner_id,
        summary="Validated business intelligence",
        signals=(),
        metrics=(),
        recommendations=(),
        confidence=Confidence(
            score=1.0,
            level=ConfidenceLevel.HIGH,
            explanation="Validated domains",
            evidence_count=0,
        ),
        generated_at=(
            generated_at
            or datetime(
                2026,
                7,
                8,
                12,
                tzinfo=UTC,
            )
        ),
    )


class CapturingService:
    def __init__(
        self,
        *,
        decision: IntelligenceDecision | None = None,
        error: Exception | None = None,
    ) -> None:
        self.decision = decision
        self.error = error
        self.contexts: list[
            IntelligenceContext
        ] = []

    async def analyze(
        self,
        *,
        context: IntelligenceContext,
    ) -> IntelligenceDecision:
        self.contexts.append(context)

        if self.error is not None:
            raise self.error

        if self.decision is not None:
            return self.decision

        return make_decision(
            owner_id=context.owner_id,
            generated_at=context.generated_at,
        )


def build_test_app(
    service: CapturingService,
    *,
    override_auth: bool = True,
    owner_id: str = OWNER_ID,
) -> FastAPI:
    app = FastAPI()

    app.include_router(
        router,
        prefix="/intelligence",
        tags=["intelligence"],
    )

    app.dependency_overrides[
        get_intelligence_service
    ] = lambda: service

    if override_auth:
        async def authenticated():
            return {
                "admin_id": owner_id,
            }

        app.dependency_overrides[
            require_auth
        ] = authenticated

    return app


def route_methods(
    app: FastAPI,
    path: str,
) -> set[str]:
    methods: set[str] = set()

    for route in app.routes:
        if getattr(route, "path", None) == path:
            methods.update(
                getattr(route, "methods", ())
                or ()
            )

    return methods


class IntelligenceApiTests(
    unittest.TestCase
):
    def test_main_application_registers_post_decision(
        self,
    ):
        self.assertEqual(
            route_methods(
                production_app,
                "/intelligence/decision",
            ),
            {"POST"},
        )

    def test_main_keeps_legacy_analytics_routes(
        self,
    ):
        self.assertIn(
            "GET",
            route_methods(
                production_app,
                "/analytics/dashboard",
            ),
        )

        self.assertIn(
            "GET",
            route_methods(
                production_app,
                "/analytics/insights",
            ),
        )

    def test_missing_authorization_is_401(
        self,
    ):
        service = CapturingService()

        app = build_test_app(
            service,
            override_auth=False,
        )

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            401,
        )

        self.assertEqual(
            response.json()["detail"],
            "Missing authorization header",
        )

        self.assertEqual(
            service.contexts,
            [],
        )

    def test_invalid_authenticated_owner_is_401(
        self,
    ):
        service = CapturingService()

        app = build_test_app(
            service,
            owner_id="not-an-object-id",
        )

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            401,
        )

        self.assertEqual(
            response.json()["detail"],
            "Invalid token",
        )

        self.assertEqual(
            service.contexts,
            [],
        )

    def test_request_owner_id_is_forbidden(
        self,
    ):
        service = CapturingService()
        payload = request_payload()

        payload["owner_id"] = OTHER_OWNER_ID

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=payload,
            )

        self.assertEqual(
            response.status_code,
            422,
        )

        errors = response.json()["detail"]

        self.assertTrue(
            any(
                error["loc"][-1] == "owner_id"
                and error["type"] == "extra_forbidden"
                for error in errors
            )
        )

    def test_capacity_source_is_forbidden(
        self,
    ):
        service = CapturingService()
        payload = request_payload()

        payload["capacity"]["source"] = (
            "client-controlled"
        )

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=payload,
            )

        self.assertEqual(
            response.status_code,
            422,
        )

        errors = response.json()["detail"]

        self.assertTrue(
            any(
                error["loc"][-1] == "source"
                and error["type"] == "extra_forbidden"
                for error in errors
            )
        )

    def test_reversed_analysis_window_is_422(
        self,
    ):
        service = CapturingService()
        payload = request_payload()

        payload["window"]["start"] = (
            "2026-07-08"
        )

        payload["window"]["end"] = (
            "2026-07-01"
        )

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=payload,
            )

        self.assertEqual(
            response.status_code,
            422,
        )

        self.assertEqual(
            service.contexts,
            [],
        )

    def test_currency_is_normalized(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            service.contexts[0].currency,
            "AMD",
        )

    def test_context_uses_authenticated_owner_only(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            service.contexts[0].owner_id,
            OWNER_ID,
        )

        self.assertEqual(
            response.json()["owner_id"],
            OWNER_ID,
        )

    def test_context_uses_server_defaults(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        context = service.contexts[0]

        self.assertEqual(
            context.locale,
            "en",
        )

        self.assertEqual(
            context.timezone,
            "UTC",
        )

        self.assertEqual(
            context.window.label,
            "weekly",
        )

    def test_capacity_baseline_is_attached(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        baseline = service.contexts[0].metadata[
            CAPACITY_BASELINE_METADATA_KEY
        ]

        self.assertIsInstance(
            baseline,
            CapacityBaseline,
        )

        self.assertEqual(
            baseline.owner_id,
            OWNER_ID,
        )

        self.assertEqual(
            baseline.source,
            CAPACITY_SOURCE_LABEL,
        )

        self.assertEqual(
            baseline.total_slots,
            10,
        )

        self.assertEqual(
            baseline.active_staff_count,
            2,
        )

        self.assertEqual(
            baseline.available_minutes,
            960,
        )

    def test_capacity_period_matches_inclusive_window(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        baseline = service.contexts[0].metadata[
            CAPACITY_BASELINE_METADATA_KEY
        ]

        self.assertEqual(
            baseline.period_start,
            datetime(
                2026,
                7,
                1,
                tzinfo=UTC,
            ),
        )

        self.assertEqual(
            baseline.period_end,
            datetime(
                2026,
                7,
                8,
                tzinfo=UTC,
            ),
        )

    def test_success_response_uses_exact_contract(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            200,
        )

        body = response.json()

        self.assertEqual(
            tuple(body.keys()),
            (
                "owner_id",
                "summary",
                "signals",
                "metrics",
                "recommendations",
                "confidence",
                "generated_at",
            ),
        )

        self.assertEqual(
            body["summary"],
            "Validated business intelligence",
        )

        self.assertEqual(
            body["signals"],
            [],
        )

        self.assertEqual(
            body["metrics"],
            [],
        )

        self.assertEqual(
            body["recommendations"],
            [],
        )

        self.assertEqual(
            body["confidence"],
            {
                "score": 1.0,
                "level": "high",
                "explanation":
                    "Validated domains",
                "evidence_count": 0,
            },
        )

    def test_cross_tenant_decision_is_rejected(
        self,
    ):
        service = CapturingService(
            decision=make_decision(
                owner_id=OTHER_OWNER_ID
            )
        )

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            500,
        )

        self.assertEqual(
            response.json()["detail"],
            (
                "Intelligence tenant "
                "validation failed"
            ),
        )

    def test_capacity_unavailable_is_422(
        self,
    ):
        service = CapturingService(
            error=CapacityDataUnavailable(
                "trusted capacity baseline "
                "is unavailable"
            )
        )

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            422,
        )

        self.assertEqual(
            response.json()["detail"],
            (
                "trusted capacity baseline "
                "is unavailable"
            ),
        )

    def test_database_unavailable_is_503(
        self,
    ):
        service = CapturingService(
            error=RuntimeError(
                "Database not connected"
            )
        )

        app = build_test_app(service)

        with TestClient(app) as client:
            response = client.post(
                "/intelligence/decision",
                json=request_payload(),
            )

        self.assertEqual(
            response.status_code,
            503,
        )

        self.assertEqual(
            response.json()["detail"],
            "Intelligence service unavailable",
        )

    def test_openapi_uses_explicit_response_model(
        self,
    ):
        service = CapturingService()
        app = build_test_app(service)

        schema = app.openapi()

        operation = schema["paths"][
            "/intelligence/decision"
        ]["post"]

        response_schema = operation[
            "responses"
        ]["200"]["content"][
            "application/json"
        ]["schema"]

        self.assertEqual(
            response_schema["$ref"],
            (
                "#/components/schemas/"
                "IntelligenceDecisionResponse"
            ),
        )

        self.assertIn(
            "IntelligenceDecisionResponse",
            schema["components"]["schemas"],
        )

    def test_default_service_constructs_without_db_io(
        self,
    ):
        service = get_intelligence_service()

        self.assertIsInstance(
            service,
            IntelligenceService,
        )

        direct = (
            create_provider_family_intelligence_service()
        )

        self.assertIsInstance(
            direct,
            IntelligenceService,
        )


if __name__ == "__main__":
    unittest.main()
