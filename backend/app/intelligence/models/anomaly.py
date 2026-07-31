from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BusinessAnomaly:
    """
    Represents a detected business deviation.
    """

    metric: str
    expected_value: float
    actual_value: float
    deviation_percent: float
    severity: str

    def __post_init__(self) -> None:
        if not self.metric.strip():
            raise ValueError(
                "anomaly metric is required"
            )

        if not self.severity.strip():
            raise ValueError(
                "anomaly severity is required"
            )
