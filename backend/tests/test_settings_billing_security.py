from __future__ import annotations

import asyncio
import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi import HTTPException

from app.api import billing as billing_api
from app.services import billing as billing_service


OWNER_ID = "6a43c75072c43ebd5355030b"


class _Collection:
    def __init__(self, document=None):
        self.document = document
        self.update_calls = []

    async def find_one(self, query):
        return self.document

    async def update_one(self, query, update, upsert=False):
        self.update_calls.append((query, update, upsert))
        return object()


class _Db:
    def __init__(self, subscription=None, admin_user=None):
        self.subscriptions = _Collection(subscription)
        self.admin_users = _Collection(admin_user)


class SettingsBillingSecurityTests(unittest.TestCase):
    def test_status_read_does_not_create_subscription(self) -> None:
        db = _Db(subscription=None)

        result = asyncio.run(
            billing_service.get_subscription_status(db, OWNER_ID)
        )

        self.assertIsNone(result)
        self.assertEqual(db.subscriptions.update_calls, [])

    def test_internal_set_plan_is_default_deny(self) -> None:
        db = _Db(
            admin_user={
                "_id": ObjectId(OWNER_ID),
                "email": "operator@example.com",
            }
        )

        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    billing_api._require_billing_operator(
                        db,
                        {"admin_id": OWNER_ID},
                    )
                )

        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(
            caught.exception.detail,
            {"code": "billing_operator_required"},
        )

    def test_internal_set_plan_requires_explicit_operator_allowlist(self) -> None:
        db = _Db(
            admin_user={
                "_id": ObjectId(OWNER_ID),
                "email": "operator@example.com",
            }
        )

        with patch.dict(
            "os.environ",
            {
                "BILLING_OPERATOR_MUTATION_ENABLED": "true",
                "BILLING_OPERATOR_EMAILS": "operator@example.com",
            },
            clear=True,
        ):
            result = asyncio.run(
                billing_api._require_billing_operator(
                    db,
                    {"admin_id": OWNER_ID},
                )
            )

        self.assertIsNone(result)

    def test_owner_role_or_enterprise_plan_do_not_grant_operator_authority(self) -> None:
        db = _Db(
            admin_user={
                "_id": ObjectId(OWNER_ID),
                "email": "owner@example.com",
                "role": "owner",
            }
        )

        with patch.dict(
            "os.environ",
            {
                "BILLING_OPERATOR_MUTATION_ENABLED": "true",
                "BILLING_OPERATOR_EMAILS": "operator@example.com",
            },
            clear=True,
        ):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(
                    billing_api._require_billing_operator(
                        db,
                        {"admin_id": OWNER_ID},
                    )
                )

        self.assertEqual(caught.exception.status_code, 403)

    def test_unknown_stripe_plan_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            billing_service.normalize_stripe_plan("mystery")

    def test_return_url_is_fail_closed(self) -> None:
        with self.assertRaises(ValueError):
            billing_service.validate_billing_return_url(
                "https://evil.example/callback"
            )

        self.assertEqual(
            billing_service.validate_billing_return_url(
                "http://localhost:8081/billing/success"
            ),
            "http://localhost:8081/billing/success",
        )


if __name__ == "__main__":
    unittest.main()
