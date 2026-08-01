import unittest

import app.intelligence as intelligence
import app.intelligence.providers as providers
from app.intelligence.context import IntelligenceContext
from app.intelligence.execution import (
    create_execution_context,
    get_execution_snapshot,
)
from app.intelligence.provider_family import (
    IntelligenceProviderFamily,
)
from app.intelligence.providers import (
    MongoCapacityProvider,
    MongoClientProvider,
    MongoRevenueProvider,
    MongoServiceProvider,
    create_mongo_provider_family,
)


class FakeRevenueProvider:
    def get_revenue_snapshot(
        self,
        *,
        context,
    ):
        return object()


class FakeCapacityProvider:
    def get_capacity_snapshot(
        self,
        *,
        context,
    ):
        return object()


class FakeClientProvider:
    def get_client_snapshot(
        self,
        *,
        context,
    ):
        return object()


class FakeServiceProvider:
    def get_service_snapshot(
        self,
        *,
        context,
    ):
        return object()


def make_family() -> IntelligenceProviderFamily:
    return IntelligenceProviderFamily(
        revenue=FakeRevenueProvider(),
        capacity=FakeCapacityProvider(),
        client=FakeClientProvider(),
        service=FakeServiceProvider(),
    )


class ProviderFamilyContractTests(unittest.TestCase):
    def test_accepts_all_runtime_provider_contracts(
        self,
    ) -> None:
        revenue = FakeRevenueProvider()
        capacity = FakeCapacityProvider()
        client = FakeClientProvider()
        service = FakeServiceProvider()

        family = IntelligenceProviderFamily(
            revenue=revenue,
            capacity=capacity,
            client=client,
            service=service,
        )

        self.assertIs(family.revenue, revenue)
        self.assertIs(family.capacity, capacity)
        self.assertIs(family.client, client)
        self.assertIs(family.service, service)

    def test_family_is_immutable(self) -> None:
        family = make_family()

        with self.assertRaises(AttributeError):
            family.client = FakeClientProvider()  # type: ignore[misc]

    def test_rejects_invalid_revenue_provider(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "revenue must satisfy AnalyticsProvider",
        ):
            IntelligenceProviderFamily(
                revenue=object(),
                capacity=FakeCapacityProvider(),
                client=FakeClientProvider(),
                service=FakeServiceProvider(),
            )

    def test_rejects_invalid_capacity_provider(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "capacity must satisfy CapacityProvider",
        ):
            IntelligenceProviderFamily(
                revenue=FakeRevenueProvider(),
                capacity=object(),
                client=FakeClientProvider(),
                service=FakeServiceProvider(),
            )

    def test_rejects_invalid_client_provider(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "client must satisfy ClientProvider",
        ):
            IntelligenceProviderFamily(
                revenue=FakeRevenueProvider(),
                capacity=FakeCapacityProvider(),
                client=object(),
                service=FakeServiceProvider(),
            )

    def test_rejects_invalid_service_provider(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "service must satisfy ServiceProvider",
        ):
            IntelligenceProviderFamily(
                revenue=FakeRevenueProvider(),
                capacity=FakeCapacityProvider(),
                client=FakeClientProvider(),
                service=object(),
            )

    def test_mongo_factory_returns_complete_family(
        self,
    ) -> None:
        family = create_mongo_provider_family()

        self.assertIsInstance(
            family.revenue,
            MongoRevenueProvider,
        )
        self.assertIsInstance(
            family.capacity,
            MongoCapacityProvider,
        )
        self.assertIsInstance(
            family.client,
            MongoClientProvider,
        )
        self.assertIsInstance(
            family.service,
            MongoServiceProvider,
        )

    def test_mongo_factory_returns_fresh_instances(
        self,
    ) -> None:
        first = create_mongo_provider_family()
        second = create_mongo_provider_family()

        for field_name in (
            "revenue",
            "capacity",
            "client",
            "service",
        ):
            with self.subTest(field_name=field_name):
                self.assertIsNot(
                    getattr(first, field_name),
                    getattr(second, field_name),
                )

    def test_provider_package_exports_complete_surface(
        self,
    ) -> None:
        self.assertEqual(
            set(providers.__all__),
            {
                "MongoCapacityProvider",
                "MongoClientProvider",
                "MongoRevenueProvider",
                "MongoServiceProvider",
                "create_mongo_provider_family",
            },
        )

    def test_domain_package_exports_family_contract(
        self,
    ) -> None:
        self.assertIs(
            intelligence.IntelligenceProviderFamily,
            IntelligenceProviderFamily,
        )
        self.assertIn(
            "IntelligenceProviderFamily",
            intelligence.__all__,
        )

    def test_execution_context_does_not_mutate_original(
        self,
    ) -> None:
        original = IntelligenceContext(
            owner_id="tenant-a",
            metadata={
                "request_id": "request-a",
            },
        )

        execution = create_execution_context(
            original
        )

        self.assertEqual(
            original.metadata,
            {
                "request_id": "request-a",
            },
        )
        self.assertIsNot(
            execution.metadata,
            original.metadata,
        )


class ExecutionCacheIsolationTests(
    unittest.IsolatedAsyncioTestCase
):
    async def test_same_provider_is_isolated_by_domain(
        self,
    ) -> None:
        provider = object()

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a"
            )
        )

        calls = {
            "client": 0,
            "service": 0,
        }

        async def load_client():
            calls["client"] += 1
            return "client-snapshot"

        async def load_service():
            calls["service"] += 1
            return "service-snapshot"

        first_client = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=provider,
            loader=load_client,
        )

        second_client = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=provider,
            loader=load_client,
        )

        first_service = await get_execution_snapshot(
            context=context,
            domain="service",
            provider=provider,
            loader=load_service,
        )

        second_service = await get_execution_snapshot(
            context=context,
            domain="service",
            provider=provider,
            loader=load_service,
        )

        self.assertEqual(
            first_client,
            "client-snapshot",
        )
        self.assertEqual(
            second_client,
            "client-snapshot",
        )
        self.assertEqual(
            first_service,
            "service-snapshot",
        )
        self.assertEqual(
            second_service,
            "service-snapshot",
        )

        self.assertEqual(
            calls,
            {
                "client": 1,
                "service": 1,
            },
        )

    async def test_same_domain_is_isolated_by_provider_identity(
        self,
    ) -> None:
        first_provider = object()
        second_provider = object()

        context = create_execution_context(
            IntelligenceContext(
                owner_id="tenant-a"
            )
        )

        calls = {
            "first": 0,
            "second": 0,
        }

        async def load_first():
            calls["first"] += 1
            return "first-snapshot"

        async def load_second():
            calls["second"] += 1
            return "second-snapshot"

        first_result = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=first_provider,
            loader=load_first,
        )

        first_cached = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=first_provider,
            loader=load_first,
        )

        second_result = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=second_provider,
            loader=load_second,
        )

        second_cached = await get_execution_snapshot(
            context=context,
            domain="client",
            provider=second_provider,
            loader=load_second,
        )

        self.assertEqual(
            first_result,
            "first-snapshot",
        )
        self.assertEqual(
            first_cached,
            "first-snapshot",
        )
        self.assertEqual(
            second_result,
            "second-snapshot",
        )
        self.assertEqual(
            second_cached,
            "second-snapshot",
        )

        self.assertEqual(
            calls,
            {
                "first": 1,
                "second": 1,
            },
        )


if __name__ == "__main__":
    unittest.main()
