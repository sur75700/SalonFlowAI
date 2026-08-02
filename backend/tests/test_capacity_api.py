from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
import unittest

from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.capacity import (
    get_capacity_service,
    router,
)
from app.api.deps import require_auth
from app.capacity.repository import CapacityRevisionConflict

OWNER_ID = "64b000000000000000000001"


class FakeCapacityService:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str]] = []
        self.profile_error: Exception | None = None

    @staticmethod
    def _profile() -> dict[str, Any]:
        now = datetime.now(UTC)
        return {
            "_id": ObjectId(),
            "schema_version": 1,
            "revision": 1,
            "status": "draft",
            "timezone": "Asia/Yerevan",
            "slot_duration_minutes": 30,
            "weekly_business_hours": [],
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def _staff() -> dict[str, Any]:
        now = datetime.now(UTC)
        return {
            "_id": ObjectId(),
            "schema_version": 1,
            "revision": 1,
            "display_name": "Anna",
            "is_active": True,
            "capacity_enabled": True,
            "created_at": now,
            "updated_at": now,
        }

    async def get_configuration(
        self,
        *,
        owner_id: str,
    ) -> dict[str, Any] | None:
        self.calls.append(("get_configuration", owner_id))
        return None

    async def save_configuration(
        self,
        *,
        owner_id: str,
        payload: Any,
    ) -> dict[str, Any]:
        self.calls.append(("save_configuration", owner_id))
        if self.profile_error is not None:
            raise self.profile_error
        return self._profile()

    async def get_readiness(
        self,
        *,
        owner_id: str,
    ) -> dict[str, Any]:
        self.calls.append(("get_readiness", owner_id))
        return {
            "ready": False,
            "status": "not_configured",
            "missing": ["salon_timezone"],
            "profile_revision": None,
        }

    async def list_staff(
        self,
        *,
        owner_id: str,
    ) -> list[dict[str, Any]]:
        self.calls.append(("list_staff", owner_id))
        return []

    async def create_staff(
        self,
        *,
        owner_id: str,
        payload: Any,
    ) -> dict[str, Any]:
        self.calls.append(("create_staff", owner_id))
        return self._staff()


class CapacityApiTests(unittest.TestCase):
    def build_client(
        self,
        *,
        authenticated: bool,
        service: FakeCapacityService,
    ) -> TestClient:
        app = FastAPI()
        app.include_router(router, prefix="/capacity")
        app.dependency_overrides[get_capacity_service] = (
            lambda: service
        )
        if authenticated:
            app.dependency_overrides[require_auth] = (
                lambda: {"admin_id": OWNER_ID}
            )
        return TestClient(app)

    def test_authentication_is_required(self) -> None:
        service = FakeCapacityService()
        client = self.build_client(
            authenticated=False,
            service=service,
        )

        response = client.get("/capacity/readiness")

        self.assertEqual(response.status_code, 401)

    def test_owner_id_is_forbidden_in_profile_body(self) -> None:
        service = FakeCapacityService()
        client = self.build_client(
            authenticated=True,
            service=service,
        )

        response = client.put(
            "/capacity/configuration",
            json={
                "owner_id": "64b000000000000000000002",
                "timezone": "UTC",
                "slot_duration_minutes": 30,
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(service.calls, [])

    def test_profile_uses_authenticated_owner(self) -> None:
        service = FakeCapacityService()
        client = self.build_client(
            authenticated=True,
            service=service,
        )

        response = client.put(
            "/capacity/configuration",
            json={
                "timezone": "Asia/Yerevan",
                "slot_duration_minutes": 30,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            service.calls,
            [("save_configuration", OWNER_ID)],
        )
        self.assertNotIn("owner_id", response.json())

    def test_revision_conflict_is_409(self) -> None:
        service = FakeCapacityService()
        service.profile_error = CapacityRevisionConflict(
            "configuration revision does not match"
        )
        client = self.build_client(
            authenticated=True,
            service=service,
        )

        response = client.put(
            "/capacity/configuration",
            json={
                "revision": 2,
                "timezone": "UTC",
                "slot_duration_minutes": 30,
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertIn("revision", response.json()["detail"])

    def test_create_staff_uses_authenticated_owner(self) -> None:
        service = FakeCapacityService()
        client = self.build_client(
            authenticated=True,
            service=service,
        )

        response = client.post(
            "/capacity/staff",
            json={"display_name": "Anna"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            service.calls,
            [("create_staff", OWNER_ID)],
        )

    def test_openapi_contains_capacity_routes(self) -> None:
        service = FakeCapacityService()
        client = self.build_client(
            authenticated=True,
            service=service,
        )

        paths = client.get("/openapi.json").json()["paths"]

        self.assertIn("/capacity/configuration", paths)
        self.assertIn("/capacity/staff/{staff_id}/schedule", paths)
        self.assertIn("/capacity/exceptions", paths)


if __name__ == "__main__":
    unittest.main()
