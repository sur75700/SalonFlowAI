from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class AnalysisWindow:
    """
    Defines a deterministic intelligence analysis period.
    """

    start: date
    end: date
    label: str = "current"

    def __post_init__(self) -> None:
        if self.start > self.end:
            raise ValueError(
                "analysis window start cannot be after end"
            )

        if not self.label.strip():
            raise ValueError(
                "analysis window label is required"
            )

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1
