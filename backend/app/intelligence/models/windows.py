from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


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


def resolve_local_date_window_utc(
    *,
    start: date,
    end: date,
    timezone_name: str,
) -> tuple[datetime, datetime]:
    """
    Resolve inclusive owner-local calendar dates to a UTC half-open range.

    The returned interval is [local start midnight, midnight after the
    inclusive local end date), converted to aware UTC instants. IANA rules
    are applied by zoneinfo, including DST transitions.
    """
    if not isinstance(start, date) or isinstance(start, datetime):
        raise TypeError("start must be a date")
    if not isinstance(end, date) or isinstance(end, datetime):
        raise TypeError("end must be a date")
    if start > end:
        raise ValueError("analysis window start cannot be after end")
    if not isinstance(timezone_name, str):
        raise TypeError("timezone_name must be a string")

    normalized_timezone = timezone_name.strip()
    if not normalized_timezone:
        raise ValueError("timezone is required")

    try:
        timezone = ZoneInfo(normalized_timezone)
    except (ZoneInfoNotFoundError, ValueError) as error:
        raise ValueError("timezone must be a valid IANA timezone") from error

    def resolve_midnight(boundary_date: date) -> datetime:
        naive_midnight = datetime.combine(boundary_date, time.min)
        exact_candidates: set[datetime] = set()
        forward_candidates: list[tuple[datetime, datetime]] = []

        for fold in (0, 1):
            local_midnight = naive_midnight.replace(
                tzinfo=timezone,
                fold=fold,
            )
            utc_candidate = local_midnight.astimezone(UTC)
            round_trip = utc_candidate.astimezone(timezone).replace(
                tzinfo=None
            )

            if round_trip == naive_midnight:
                exact_candidates.add(utc_candidate)
            elif round_trip > naive_midnight:
                forward_candidates.append((round_trip, utc_candidate))

        if exact_candidates:
            return min(exact_candidates)
        if forward_candidates:
            return min(forward_candidates)[1]

        raise ValueError("local midnight boundary is not representable")

    try:
        period_start = resolve_midnight(start)
        period_end = resolve_midnight(end + timedelta(days=1))
    except OverflowError as error:
        raise ValueError("analysis window boundary is not representable") from error
    if period_end <= period_start:
        raise ValueError("analysis window must resolve to a positive period")

    return period_start, period_end
