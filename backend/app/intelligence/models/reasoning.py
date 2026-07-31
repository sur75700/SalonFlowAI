from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ReasoningScore:
    """
    Structured intelligence reasoning score.
    """

    signal_weight: float
    evidence_strength: float
    business_impact: float
    final_score: float

    def __post_init__(self) -> None:
        values = (
            self.signal_weight,
            self.evidence_strength,
            self.business_impact,
            self.final_score,
        )

        if any(
            value < 0 or value > 1
            for value in values
        ):
            raise ValueError(
                "reasoning scores must be between 0 and 1"
            )
