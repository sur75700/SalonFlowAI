import unittest
from collections.abc import Awaitable
from datetime import UTC, datetime, timedelta
from typing import get_args, get_origin, get_type_hints

from app.intelligence.service_intelligence import (
    ServicePerformanceSnapshot,
    ServiceProvider,
    ServiceSnapshot,
)


def make_performance(
    **overrides: object,
) -> ServicePerformanceSnapshot:
    values: dict[str, object] = {
        "service_id": "service-a",
        "name": "Haircut",
        "catalog_present": True,
        "is_active": True,
        "duration_minutes": 60,
        "configured_price_minor": 15_000,
        "appointment_count": 10,
        "completed_booking_count": 6,
        "scheduled_booking_count": 2,
        "cancelled_booking_count": 1,
        "other_booking_count": 1,
        "completed_revenue_minor": 90_000,
        "scheduled_value_minor": 30_000,
        "cancelled_value_minor": 15_000,
    }

    values.update(overrides)

    return ServicePerformanceSnapshot(
        **values  # type: ignore[arg-type]
    )


def make_snapshot(
    **overrides: object,
) -> ServiceSnapshot:
    period_start = datetime(
        2026,
        7,
        1,
        tzinfo=UTC,
    )

    services = (
        make_performance(),
        make_performance(
            service_id="service-b",
            name="Color",
            is_active=False,
        ),
    )

    values: dict[str, object] = {
        "owner_id": "tenant-a",
        "period_start": period_start,
        "period_end": (
            period_start + timedelta(days=7)
        ),
        "currency": "AMD",
        "total_service_count": 2,
        "active_service_count": 1,
        "services": services,
    }

    values.update(overrides)

    return ServiceSnapshot(
        **values  # type: ignore[arg-type]
    )


class ServicePerformanceTests(unittest.TestCase):
    def test_normalizes_identity_and_name(self) -> None:
        snapshot = make_performance(
            service_id="  service-a  ",
            name="  Haircut  ",
        )

        self.assertEqual(snapshot.service_id, "service-a")
        self.assertEqual(snapshot.name, "Haircut")

    def test_demand_excludes_cancelled_and_other(self) -> None:
        snapshot = make_performance()

        self.assertEqual(
            snapshot.demand_booking_count,
            8,
        )

    def test_rejects_empty_service_id(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "service_id is required",
        ):
            make_performance(service_id=" ")

    def test_rejects_non_boolean_active_state(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "is_active must be a boolean",
        ):
            make_performance(is_active=1)

    def test_rejects_zero_catalog_duration(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "catalog-backed duration_minutes must be",
        ):
            make_performance(duration_minutes=0)

    def test_historical_service_allows_unknown_duration(
        self,
    ) -> None:
        snapshot = make_performance(
            catalog_present=False,
            is_active=False,
            duration_minutes=0,
        )

        self.assertFalse(snapshot.catalog_present)
        self.assertFalse(snapshot.is_active)
        self.assertEqual(snapshot.duration_minutes, 0)

    def test_historical_service_cannot_be_active(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "historical-only service cannot be active",
        ):
            make_performance(
                catalog_present=False,
                is_active=True,
            )

    def test_rejects_non_boolean_catalog_state(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "catalog_present must be a boolean",
        ):
            make_performance(
                catalog_present=1,
            )

    def test_rejects_negative_money(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "completed_revenue_minor cannot be negative",
        ):
            make_performance(
                completed_revenue_minor=-1
            )

    def test_requires_complete_status_partition(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "appointment_count must equal",
        ):
            make_performance(
                appointment_count=99
            )


class ServiceSnapshotTests(unittest.TestCase):
    def test_normalizes_identity_currency_and_period(self) -> None:
        snapshot = make_snapshot(
            owner_id="  tenant-a  ",
            currency=" amd ",
            period_start=datetime(2026, 7, 1),
            period_end=datetime(2026, 7, 8),
        )

        self.assertEqual(snapshot.owner_id, "tenant-a")
        self.assertEqual(snapshot.currency, "AMD")
        self.assertEqual(snapshot.period_start.tzinfo, UTC)
        self.assertEqual(snapshot.period_end.tzinfo, UTC)

    def test_is_immutable(self) -> None:
        snapshot = make_snapshot()

        with self.assertRaises(AttributeError):
            snapshot.total_service_count = 1  # type: ignore[misc]

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

    def test_total_count_must_match_collection(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "total_service_count must match",
        ):
            make_snapshot(total_service_count=3)

    def test_active_count_must_match_records(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "active_service_count must match",
        ):
            make_snapshot(active_service_count=2)

    def test_rejects_duplicate_service_ids(self) -> None:
        duplicate = make_performance()

        with self.assertRaisesRegex(
            ValueError,
            "service identifiers must be unique",
        ):
            make_snapshot(
                services=(duplicate, duplicate),
                active_service_count=2,
            )

    def test_requires_immutable_tuple(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "services must be a tuple",
        ):
            make_snapshot(
                services=[make_performance()],
                total_service_count=1,
                active_service_count=1,
            )

    def test_provider_supports_sync_or_async_result(self) -> None:
        return_type = get_type_hints(
            ServiceProvider.get_service_snapshot
        )["return"]

        members = get_args(return_type)

        self.assertIn(ServiceSnapshot, members)

        awaitables = tuple(
            member
            for member in members
            if get_origin(member) is Awaitable
        )

        self.assertEqual(len(awaitables), 1)
        self.assertEqual(
            get_args(awaitables[0]),
            (ServiceSnapshot,),
        )


if __name__ == "__main__":
    unittest.main()
