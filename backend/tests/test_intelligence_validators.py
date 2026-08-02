import unittest

from app.intelligence import (
    Metric,
    Recommendation,
    Signal,
    SignalSeverity,
    validate_confidence_input,
    validate_metrics,
    validate_recommendations,
    validate_signals,
    validate_summary,
)


class IntelligenceValidatorTests(unittest.TestCase):
    def test_valid_inputs_are_returned(self) -> None:
        signals = (
            Signal(
                code="capacity",
                title="Unused capacity",
                description="Open slots detected",
                severity=SignalSeverity.OPPORTUNITY,
            ),
        )

        metrics = (
            Metric(
                key="open_slots",
                label="Open slots",
                value=3,
                unit="slots",
            ),
        )

        recommendations = (
            Recommendation(
                code="promote_slots",
                title="Promote slots",
                description="Target inactive clients",
                priority=1,
            ),
        )

        self.assertIs(validate_signals(signals), signals)
        self.assertIs(validate_metrics(metrics), metrics)
        self.assertIs(
            validate_recommendations(recommendations),
            recommendations,
        )
        self.assertEqual(
            validate_summary("  Valid summary  "),
            "Valid summary",
        )
        self.assertEqual(
            validate_confidence_input(
                0.82,
                "  Strong recent data  ",
            ),
            (0.82, "Strong recent data"),
        )

    def test_duplicate_signal_codes_are_rejected(self) -> None:
        signal = Signal(
            code="capacity",
            title="Unused capacity",
            description="Open slots detected",
            severity=SignalSeverity.OPPORTUNITY,
        )

        with self.assertRaisesRegex(
            ValueError,
            "duplicate signal code",
        ):
            validate_signals((signal, signal))

    def test_duplicate_metric_keys_are_rejected(self) -> None:
        metric = Metric(
            key="revenue",
            label="Revenue",
            value=100000,
            unit="AMD",
        )

        with self.assertRaisesRegex(
            ValueError,
            "duplicate metric key",
        ):
            validate_metrics((metric, metric))

    def test_duplicate_recommendation_codes_are_rejected(
        self,
    ) -> None:
        recommendation = Recommendation(
            code="promote_slots",
            title="Promote slots",
            description="Target inactive clients",
            priority=1,
        )

        with self.assertRaisesRegex(
            ValueError,
            "duplicate recommendation code",
        ):
            validate_recommendations(
                (recommendation, recommendation)
            )

    def test_non_tuple_collections_are_rejected(self) -> None:
        with self.assertRaises(TypeError):
            validate_signals([])  # type: ignore[arg-type]

        with self.assertRaises(TypeError):
            validate_metrics([])  # type: ignore[arg-type]

        with self.assertRaises(TypeError):
            validate_recommendations([])  # type: ignore[arg-type]

    def test_invalid_summary_is_rejected(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "summary is required",
        ):
            validate_summary("   ")

    def test_invalid_confidence_inputs_are_rejected(self) -> None:
        invalid_scores = (-0.01, 1.01)

        for score in invalid_scores:
            with self.subTest(score=score):
                with self.assertRaises(ValueError):
                    validate_confidence_input(
                        score,
                        "Valid explanation",
                    )

        with self.assertRaises(TypeError):
            validate_confidence_input(
                True,
                "Valid explanation",
            )

        with self.assertRaisesRegex(
            ValueError,
            "confidence explanation is required",
        ):
            validate_confidence_input(0.5, "   ")


if __name__ == "__main__":
    unittest.main()
