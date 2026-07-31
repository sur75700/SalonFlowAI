import unittest

from app.intelligence.models import (
    BusinessAnomaly,
    ForecastPoint,
    ReasoningScore,
)


class IntelligenceModelContractTests(unittest.TestCase):

    def test_reasoning_score_accepts_valid_values(self) -> None:
        score = ReasoningScore(
            signal_weight=0.8,
            evidence_strength=0.9,
            business_impact=0.7,
            final_score=0.82,
        )

        self.assertEqual(
            score.final_score,
            0.82,
        )

    def test_reasoning_score_rejects_out_of_range_values(self) -> None:
        with self.assertRaises(ValueError):
            ReasoningScore(
                signal_weight=1.2,
                evidence_strength=0.9,
                business_impact=0.7,
                final_score=0.82,
            )

    def test_business_anomaly_contract(self) -> None:
        anomaly = BusinessAnomaly(
            metric="revenue",
            expected_value=1000,
            actual_value=700,
            deviation_percent=-30,
            severity="warning",
        )

        self.assertEqual(
            anomaly.metric,
            "revenue",
        )

    def test_business_anomaly_requires_metric(self) -> None:
        with self.assertRaises(ValueError):
            BusinessAnomaly(
                metric="",
                expected_value=1000,
                actual_value=700,
                deviation_percent=-30,
                severity="warning",
            )

    def test_forecast_point_contract(self) -> None:
        point = ForecastPoint(
            metric="revenue",
            predicted_value=1200,
            confidence=0.85,
            horizon_days=30,
        )

        self.assertEqual(
            point.horizon_days,
            30,
        )

    def test_forecast_rejects_invalid_confidence(self) -> None:
        with self.assertRaises(ValueError):
            ForecastPoint(
                metric="revenue",
                predicted_value=1200,
                confidence=1.5,
                horizon_days=30,
            )

    def test_forecast_rejects_invalid_horizon(self) -> None:
        with self.assertRaises(ValueError):
            ForecastPoint(
                metric="revenue",
                predicted_value=1200,
                confidence=0.8,
                horizon_days=0,
            )


if __name__ == "__main__":
    unittest.main()
