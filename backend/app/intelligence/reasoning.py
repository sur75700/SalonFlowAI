from app.intelligence.contracts import Metric, Signal, SignalSeverity


_SEVERITY_ORDER = {
    SignalSeverity.CRITICAL: 0,
    SignalSeverity.WARNING: 1,
    SignalSeverity.OPPORTUNITY: 2,
    SignalSeverity.INFO: 3,
}


def prioritize_signals(signals: tuple[Signal, ...]) -> tuple[Signal, ...]:
    return tuple(
        sorted(
            signals,
            key=lambda signal: (
                _SEVERITY_ORDER[signal.severity],
                signal.code,
            ),
        )
    )


def build_reasoning_notes(
    *,
    signals: tuple[Signal, ...],
    metrics: tuple[Metric, ...],
) -> tuple[str, ...]:
    notes: list[str] = []

    for signal in prioritize_signals(signals):
        notes.append(
            f"{signal.severity.value}: {signal.title} — {signal.description}"
        )

    for metric in metrics:
        comparison = ""

        if metric.comparison_value is not None:
            change = metric.value - metric.comparison_value
            comparison = f"; change={change:+.2f}"

        unit = f" {metric.unit}" if metric.unit else ""
        notes.append(
            f"metric: {metric.label}={metric.value:.2f}{unit}{comparison}"
        )

    return tuple(notes)
