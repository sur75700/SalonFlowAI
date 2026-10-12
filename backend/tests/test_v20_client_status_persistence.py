import unittest

from pydantic import ValidationError

from app.api.clients import ClientCreate, ClientUpdate


class V20ClientStatusPersistenceTests(unittest.TestCase):
    def test_new_client_defaults_to_new_status(self):
        payload = ClientCreate(
            full_name="Test Client",
            phone="+37499111222",
        )
        self.assertEqual(payload.status, "new")

    def test_update_accepts_all_supported_statuses(self):
        statuses = ("new", "active", "returning", "vip", "inactive")
        for status in statuses:
            with self.subTest(status=status):
                payload = ClientUpdate(
                    full_name="Test Client",
                    phone="+37499111222",
                    status=status,
                )
                self.assertEqual(payload.status, status)

    def test_update_rejects_unknown_status(self):
        with self.assertRaises(ValidationError):
            ClientUpdate(
                full_name="Test Client",
                phone="+37499111222",
                status="platinum",
            )


if __name__ == "__main__":
    unittest.main()
