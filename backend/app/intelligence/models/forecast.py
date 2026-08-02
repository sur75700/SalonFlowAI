from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ForecastPoint:
    """
    Represents a future intelligence prediction.
    """

    metric: str
    predicted_value: float
    confidence: float
    horizon_days: int

    def __post_init__(self) -> None:
        if not self.metric.strip():
            raise ValueError(
                "forecast metric is required"
            )

        if self.confidence < 0 or self.confidence > 1:
            raise ValueError(
                "forecast confidence must be between 0 and 1"
            )

        if self.horizon_days <= 0:
            raise ValueError(
                "forecast horizon must be positive"
            )
