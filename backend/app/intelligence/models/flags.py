from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class IntelligenceFlags:
    """
    Feature gates for intelligence capabilities.
    """

    forecasting_enabled: bool = True
    anomaly_detection_enabled: bool = True
    recommendations_enabled: bool = True
    automation_enabled: bool = False
