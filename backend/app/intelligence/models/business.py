from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BusinessState:
    """
    Immutable business operating snapshot.
    """

    active_staff_count: int = 0
    open_slots: int = 0
    booked_slots: int = 0
    completed_bookings: int = 0
    revenue_minor: int = 0
    customer_count: int = 0

    def __post_init__(self) -> None:
        values = (
            self.active_staff_count,
            self.open_slots,
            self.booked_slots,
            self.completed_bookings,
            self.revenue_minor,
            self.customer_count,
        )

        if any(value < 0 for value in values):
            raise ValueError(
                "business state values cannot be negative"
            )

    @property
    def utilization_rate(self) -> float:
        total = self.open_slots + self.booked_slots

        if total == 0:
            return 0.0

        return round(
            self.booked_slots / total,
            4,
        )
