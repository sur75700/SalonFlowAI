import unittest
from collections.abc import Awaitable
from datetime import UTC, datetime, timedelta
from typing import get_args, get_origin, get_type_hints

from app.intelligence.client_intelligence import (
    ClientProvider,
    ClientSnapshot,
)


def make_snapshot(
    **overrides: object,
) -> ClientSnapshot:
    period_start = datetime(
        2026,
        7,
        1,
        tzinfo=UTC,
    )

    values: dict[str, object] = {
        "owner_id": "tenant-a",
        "period_start": period_start,
        "period_end": (
            period_start + timedelta(days=7)
        ),
        "currency": "AMD",
        "total_client_count": 20,
        "new_client_count": 3,
        "active_client_count": 8,
        "returning_client_count": 4,
        "historically_active_client_count": 12,
        "at_risk_client_count": 4,
        "high_value_client_count": 2,
        "completed_booking_count": 14,
        "completed_revenue_minor": 480_000,
    }

    values.update(overrides)

    return ClientSnapshot(
        **values  # type: ignore[arg-type]
    )


class ClientSnapshotTests(unittest.TestCase):
    def test_normalizes_identity_and_currency(self) -> None:
        snapshot = make_snapshot(
            owner_id="  tenant-a  ",
            currency=" amd ",
        )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "AMD")

    def test_normalizes_naive_period_to_utc(self) -> None:
        snapshot = make_snapshot(
            period_start=datetime(2026, 7, 1),
            period_end=datetime(2026, 7, 8),
        )

        self.assertEqual(snapshot.period_start.tzinfo, UTC)
        self.assertEqual(snapshot.period_end.tzinfo, UTC)

    def test_is_immutable(self) -> None:
        snapshot = make_snapshot()

        with self.assertRaises(AttributeError):
            snapshot.total_client_count = 1  # type: ignore[misc]

    def test_rejects_empty_owner(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "owner_id is required",
        ):
            make_snapshot(owner_id=" ")

    def test_rejects_empty_currency(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "currency is required",
        ):
            make_snapshot(currency=" ")

    def test_rejects_invalid_period(self) -> None:
        instant = datetime(
            2026,
            7,
            1,
            tzinfo=UTC,
        )

        with self.assertRaisesRegex(
            ValueError,
            "period_end must be later",
        ):
            make_snapshot(
                period_start=instant,
                period_end=instant,
            )

    def test_rejects_boolean_count(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "total_client_count must be an integer",
        ):
            make_snapshot(total_client_count=True)

    def test_rejects_negative_count(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "completed_revenue_minor cannot be negative",
        ):
            make_snapshot(completed_revenue_minor=-1)

    def test_new_clients_cannot_exceed_total(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "new_client_count cannot exceed",
        ):
            make_snapshot(
                total_client_count=2,
                new_client_count=3,
                active_client_count=2,
                returning_client_count=1,
                historically_active_client_count=2,
                at_risk_client_count=1,
                high_value_client_count=1,
                completed_booking_count=2,
            )

    def test_returning_clients_cannot_exceed_active(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "returning_client_count cannot exceed",
        ):
            make_snapshot(
                active_client_count=2,
                returning_client_count=3,
                high_value_client_count=1,
            )

    def test_at_risk_cannot_exceed_historical(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "at_risk_client_count cannot exceed",
        ):
            make_snapshot(
                historically_active_client_count=2,
                at_risk_client_count=3,
            )

    def test_high_value_cannot_exceed_active(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "high_value_client_count cannot exceed",
        ):
            make_snapshot(
                active_client_count=2,
                returning_client_count=1,
                high_value_client_count=3,
            )

    def test_provider_supports_sync_or_async_result(self) -> None:
        return_type = get_type_hints(
            ClientProvider.get_client_snapshot
        )["return"]

        members = get_args(return_type)

        self.assertIn(ClientSnapshot, members)

        awaitables = tuple(
            member
            for member in members
            if get_origin(member) is Awaitable
        )

        self.assertEqual(len(awaitables), 1)
        self.assertEqual(
            get_args(awaitables[0]),
            (ClientSnapshot,),
        )


if __name__ == "__main__":
    unittest.main()
