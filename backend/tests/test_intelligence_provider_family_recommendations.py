import unittest

from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Metric,
    Signal,
    SignalSeverity,
)
from app.intelligence.provider_family_recommendations import (
    ProviderFamilyRecommendationBuilder,
)


def signal(
    code: str,
    severity: SignalSeverity,
) -> Signal:
    return Signal(
        code=code,
        title=code,
        description=f"Signal: {code}",
        severity=severity,
    )


METRICS = (
    Metric(
        key="revenue.growth_percent",
        label="Revenue growth",
        value=-50.0,
        unit="percent",
    ),
    Metric(
        key="capacity.utilization_percent",
        label="Capacity utilization",
        value=110.0,
        unit="percent",
    ),
)


class ProviderFamilyRecommendationTests(
    unittest.TestCase
):
    def setUp(self):
        self.builder = (
            ProviderFamilyRecommendationBuilder()
        )
        self.context = IntelligenceContext(
            owner_id="tenant-a",
            currency="USD",
        )

    def test_builds_and_prioritizes_actions(self):
        recommendations = self.builder(
            self.context,
            (
                signal(
                    "revenue.critical_decline",
                    SignalSeverity.CRITICAL,
                ),
                signal(
                    "capacity.overloaded",
                    SignalSeverity.CRITICAL,
                ),
                signal(
                    "client.unapproved_policy",
                    SignalSeverity.WARNING,
                ),
            ),
            METRICS,
        )

        self.assertEqual(
            tuple(
                recommendation.code
                for recommendation
                in recommendations
            ),
            (
                "capacity.expand_capacity",
                "revenue.emergency_recovery",
            ),
        )

    def test_stable_actions_have_lower_priority(
        self,
    ):
        recommendations = self.builder(
            self.context,
            (
                signal(
                    "revenue.stable",
                    SignalSeverity.INFO,
                ),
                signal(
                    "capacity.healthy",
                    SignalSeverity.INFO,
                ),
            ),
            METRICS,
        )

        self.assertEqual(
            tuple(
                recommendation.code
                for recommendation
                in recommendations
            ),
            (
                "capacity.monitor_balance",
                "revenue.monitor_stability",
            ),
        )

        self.assertTrue(
            all(
                recommendation.priority == 4
                for recommendation
                in recommendations
            )
        )

    def test_ignores_unsupported_domains(self):
        recommendations = self.builder(
            self.context,
            (
                signal(
                    "client.unapproved_policy",
                    SignalSeverity.WARNING,
                ),
                signal(
                    "service.unapproved_policy",
                    SignalSeverity.OPPORTUNITY,
                ),
            ),
            METRICS,
        )

        self.assertEqual(recommendations, ())

    def test_rejects_non_tuple_signals(self):
        with self.assertRaisesRegex(
            TypeError,
            "signals must be a tuple",
        ):
            self.builder(
                self.context,
                [],
                METRICS,
            )

    def test_rejects_invalid_context(self):
        with self.assertRaisesRegex(
            TypeError,
            "context must be an IntelligenceContext",
        ):
            self.builder(
                object(),
                (),
                METRICS,
            )


if __name__ == "__main__":
    unittest.main()
