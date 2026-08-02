import json
import math
import unittest
from datetime import (
    UTC,
    datetime,
    timedelta,
    timezone,
)

from app.intelligence.context import IntelligenceContext
from app.intelligence.contracts import (
    Confidence,
    ConfidenceLevel,
    Evidence,
    ExpectedImpact,
    IntelligenceDecision,
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
)
from app.intelligence.decision_serializer import (
    serialize_intelligence_decision,
)
from app.intelligence.factory import (
    create_provider_family_intelligence_service,
)
from tests.test_intelligence_provider_family_runtime import (
    make_family,
)


OBSERVED_LOCAL = datetime(
    2026,
    8,
    1,
    12,
    30,
    tzinfo=timezone(
        timedelta(hours=4)
    ),
)

GENERATED_AT = datetime(
    2026,
    8,
    1,
    12,
    0,
    tzinfo=UTC,
)


def make_decision(
    **overrides,
) -> IntelligenceDecision:
    payload = {
        "owner_id": "tenant-a",
        "summary": "Revenue opportunity detected",
        "signals": (
            Signal(
                code="revenue.growth",
                title="Revenue growth opportunity",
                description="Revenue increased.",
                severity=(
                    SignalSeverity.OPPORTUNITY
                ),
                evidence=(
                    Evidence(
                        source="revenue.snapshot",
                        description=(
                            "Current and previous revenue"
                        ),
                        value={
                            "currency": "AMD",
                            "captured_at":
                                OBSERVED_LOCAL,
                            "history": (1000, 1250),
                            "severity":
                                SignalSeverity.INFO,
                        },
                        observed_at=OBSERVED_LOCAL,
                    ),
                ),
            ),
        ),
        "metrics": (
            Metric(
                key="revenue.current",
                label="Current revenue",
                value=1250.5,
                unit="AMD",
                comparison_value=1000,
            ),
        ),
        "recommendations": (
            Recommendation(
                code="revenue.scale_growth",
                title="Scale revenue growth",
                description="Reinforce current demand.",
                priority=3,
                expected_impacts=(
                    ExpectedImpact(
                        metric="revenue.current",
                        estimated_change=10,
                        unit="percent",
                        timeframe_days=30,
                    ),
                ),
            ),
        ),
        "confidence": Confidence(
            score=0.9,
            level=ConfidenceLevel.HIGH,
            explanation="Validated evidence",
            evidence_count=1,
        ),
        "generated_at": GENERATED_AT,
    }

    payload.update(overrides)

    return IntelligenceDecision(**payload)


class IntelligenceDecisionSerializerTests(
    unittest.IsolatedAsyncioTestCase
):
    def test_serializes_exact_external_contract(
        self,
    ):
        payload = serialize_intelligence_decision(
            make_decision(),
            expected_owner_id="tenant-a",
        )

        self.assertEqual(
            payload,
            {
                "owner_id": "tenant-a",
                "summary":
                    "Revenue opportunity detected",
                "signals": [
                    {
                        "code": "revenue.growth",
                        "title":
                            "Revenue growth opportunity",
                        "description":
                            "Revenue increased.",
                        "severity": "opportunity",
                        "evidence": [
                            {
                                "source":
                                    "revenue.snapshot",
                                "description": (
                                    "Current and "
                                    "previous revenue"
                                ),
                                "value": {
                                    "captured_at": (
                                        "2026-08-01"
                                        "T08:30:00+00:00"
                                    ),
                                    "currency": "AMD",
                                    "history": [
                                        1000,
                                        1250,
                                    ],
                                    "severity": "info",
                                },
                                "observed_at": (
                                    "2026-08-01"
                                    "T08:30:00+00:00"
                                ),
                            },
                        ],
                    },
                ],
                "metrics": [
                    {
                        "key": "revenue.current",
                        "label": "Current revenue",
                        "value": 1250.5,
                        "unit": "AMD",
                        "comparison_value": 1000.0,
                    },
                ],
                "recommendations": [
                    {
                        "code":
                            "revenue.scale_growth",
                        "title":
                            "Scale revenue growth",
                        "description":
                            "Reinforce current demand.",
                        "priority": 3,
                        "expected_impacts": [
                            {
                                "metric":
                                    "revenue.current",
                                "estimated_change":
                                    10.0,
                                "unit": "percent",
                                "timeframe_days": 30,
                            },
                        ],
                    },
                ],
                "confidence": {
                    "score": 0.9,
                    "level": "high",
                    "explanation":
                        "Validated evidence",
                    "evidence_count": 1,
                },
                "generated_at": (
                    "2026-08-01"
                    "T12:00:00+00:00"
                ),
            },
        )

        self.assertEqual(
            tuple(payload.keys()),
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

        self.assertIs(
            type(
                payload["signals"][0][
                    "severity"
                ]
            ),
            str,
        )

        self.assertIs(
            type(
                payload["confidence"]["level"]
            ),
            str,
        )

    async def test_serializes_real_provider_family_decision(
        self,
    ):
        service = (
            create_provider_family_intelligence_service(
                providers=make_family()
            )
        )

        decision = await service.analyze(
            context=IntelligenceContext(
                owner_id="tenant-a",
                currency="USD",
            )
        )

        payload = serialize_intelligence_decision(
            decision,
            expected_owner_id="tenant-a",
        )

        encoded = json.dumps(
            payload,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )

        self.assertGreater(
            len(encoded),
            1000,
        )

        self.assertEqual(
            len(payload["signals"]),
            2,
        )

        self.assertEqual(
            len(payload["metrics"]),
            29,
        )

        self.assertEqual(
            len(payload["recommendations"]),
            2,
        )

        self.assertEqual(
            payload["confidence"]["level"],
            "high",
        )

    def test_normalizes_aware_datetimes_to_utc(
        self,
    ):
        decision = make_decision(
            generated_at=OBSERVED_LOCAL
        )

        payload = serialize_intelligence_decision(
            decision
        )

        self.assertEqual(
            payload["generated_at"],
            "2026-08-01T08:30:00+00:00",
        )

    def test_rejects_naive_generated_at(
        self,
    ):
        decision = make_decision(
            generated_at=datetime(
                2026,
                8,
                1,
                12,
                0,
            )
        )

        with self.assertRaisesRegex(
            ValueError,
            "decision.generated_at must be "
            "timezone-aware",
        ):
            serialize_intelligence_decision(
                decision
            )

    def test_rejects_naive_evidence_observed_at(
        self,
    ):
        signal = Signal(
            code="capacity.healthy",
            title="Healthy capacity",
            description="Capacity is balanced.",
            severity=SignalSeverity.INFO,
            evidence=(
                Evidence(
                    source="capacity.snapshot",
                    description="Capacity facts",
                    observed_at=datetime(
                        2026,
                        8,
                        1,
                        12,
                        0,
                    ),
                ),
            ),
        )

        decision = make_decision(
            signals=(signal,)
        )

        with self.assertRaisesRegex(
            ValueError,
            "observed_at must be timezone-aware",
        ):
            serialize_intelligence_decision(
                decision
            )

    def test_rejects_cross_tenant_owner(
        self,
    ):
        with self.assertRaisesRegex(
            RuntimeError,
            "decision owner does not match "
            "expected owner",
        ):
            serialize_intelligence_decision(
                make_decision(
                    owner_id="tenant-b"
                ),
                expected_owner_id="tenant-a",
            )

    def test_matching_expected_owner_is_allowed(
        self,
    ):
        payload = serialize_intelligence_decision(
            make_decision(),
            expected_owner_id="tenant-a",
        )

        self.assertEqual(
            payload["owner_id"],
            "tenant-a",
        )

    def test_nested_evidence_values_are_encoded(
        self,
    ):
        value = {
            "z": (
                SignalSeverity.WARNING,
                OBSERVED_LOCAL,
            ),
            "a": [
                True,
                None,
                3.5,
            ],
        }

        signal = Signal(
            code="test.signal",
            title="Test",
            description="Test signal",
            severity=SignalSeverity.WARNING,
            evidence=(
                Evidence(
                    source="test",
                    description="Nested value",
                    value=value,
                    observed_at=GENERATED_AT,
                ),
            ),
        )

        payload = serialize_intelligence_decision(
            make_decision(
                signals=(signal,)
            )
        )

        encoded_value = (
            payload["signals"][0]
            ["evidence"][0]["value"]
        )

        self.assertEqual(
            tuple(encoded_value.keys()),
            ("a", "z"),
        )

        self.assertEqual(
            encoded_value["z"],
            [
                "warning",
                "2026-08-01T08:30:00+00:00",
            ],
        )

    def test_non_string_mapping_key_is_rejected(
        self,
    ):
        signal = Signal(
            code="test.signal",
            title="Test",
            description="Test",
            severity=SignalSeverity.INFO,
            evidence=(
                Evidence(
                    source="test",
                    description="Invalid mapping",
                    value={1: "invalid"},
                    observed_at=GENERATED_AT,
                ),
            ),
        )

        with self.assertRaisesRegex(
            TypeError,
            "mapping keys must be strings",
        ):
            serialize_intelligence_decision(
                make_decision(
                    signals=(signal,)
                )
            )

    def test_unsupported_evidence_value_is_rejected(
        self,
    ):
        signal = Signal(
            code="test.signal",
            title="Test",
            description="Test",
            severity=SignalSeverity.INFO,
            evidence=(
                Evidence(
                    source="test",
                    description="Unsupported value",
                    value=object(),
                    observed_at=GENERATED_AT,
                ),
            ),
        )

        with self.assertRaisesRegex(
            TypeError,
            "unsupported value type: object",
        ):
            serialize_intelligence_decision(
                make_decision(
                    signals=(signal,)
                )
            )

    def test_non_finite_numbers_are_rejected(
        self,
    ):
        decisions = (
            make_decision(
                metrics=(
                    Metric(
                        key="invalid.metric",
                        label="Invalid metric",
                        value=math.nan,
                    ),
                )
            ),
            make_decision(
                recommendations=(
                    Recommendation(
                        code="invalid.action",
                        title="Invalid action",
                        description="Invalid",
                        priority=1,
                        expected_impacts=(
                            ExpectedImpact(
                                metric="invalid",
                                estimated_change=(
                                    math.inf
                                ),
                                unit="percent",
                                timeframe_days=30,
                            ),
                        ),
                    ),
                )
            ),
            make_decision(
                confidence=Confidence(
                    score=math.nan,
                    level=ConfidenceLevel.LOW,
                    explanation="Invalid",
                    evidence_count=0,
                )
            ),
        )

        for decision in decisions:
            with self.subTest(
                decision=decision
            ):
                with self.assertRaisesRegex(
                    ValueError,
                    "must be finite",
                ):
                    serialize_intelligence_decision(
                        decision
                    )

    def test_wrong_decision_type_is_rejected(
        self,
    ):
        with self.assertRaisesRegex(
            TypeError,
            "decision must be an "
            "IntelligenceDecision",
        ):
            serialize_intelligence_decision(
                object()
            )


if __name__ == "__main__":
    unittest.main()
