import unittest
from datetime import UTC, datetime

from app.intelligence.client_intelligence import (
    ClientMetricBuilder,
    ClientSnapshot,
    build_client_metrics,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
)


START = datetime(2026, 7, 1, tzinfo=UTC)
END = datetime(2026, 7, 8, tzinfo=UTC)


def make_snapshot() -> ClientSnapshot:
    return ClientSnapshot(
        owner_id="tenant-a",
        period_start=START,
        period_end=END,
        currency="USD",
        total_client_count=20,
        new_client_count=3,
        active_client_count=8,
        returning_client_count=4,
        historically_active_client_count=12,
        at_risk_client_count=5,
        high_value_client_count=2,
        completed_booking_count=11,
        completed_revenue_minor=55_000,
    )


class CountingClientProvider:
    def __init__(self):
        self.calls = 0

    def get_client_snapshot(
        self,
        *,
        context,
    ):
        self.calls += 1
        return make_snapshot()


class ClientMetricTests(
    unittest.IsolatedAsyncioTestCase
):
    def test_builds_direct_client_metrics(self):
        metrics = build_client_metrics(
            snapshot=make_snapshot()
        )

        values = {
            metric.key: metric.value
            for metric in metrics
        }

        self.assertEqual(len(metrics), 9)
        self.assertEqual(
            values["client.total_count"],
            20,
        )
        self.assertEqual(
            values["client.at_risk_count"],
            5,
        )
        self.assertEqual(
            values["client.completed_revenue_minor"],
            55_000,
        )

    def test_rejects_invalid_snapshot(self):
        with self.assertRaisesRegex(
            TypeError,
            "snapshot must be a ClientSnapshot",
        ):
            build_client_metrics(
                snapshot=object()
            )

    async def test_builder_uses_execution_cache(self):
        provider = CountingClientProvider()
        builder = ClientMetricBuilder(
            provider=provider
        )

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        first = await builder(context)
        second = await builder(context)

        self.assertEqual(first, second)
        self.assertEqual(provider.calls, 1)

    def test_rejects_invalid_provider(self):
        with self.assertRaisesRegex(
            TypeError,
            "provider must satisfy ClientProvider",
        ):
            ClientMetricBuilder(
                provider=object()
            )


if __name__ == "__main__":
    unittest.main()
