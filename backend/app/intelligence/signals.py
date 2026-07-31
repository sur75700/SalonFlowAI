from collections.abc import Iterable

from app.intelligence.contracts import Signal


class SignalRegistry:
    def __init__(self) -> None:
        self._signals: list[Signal] = []

    def add(self, signal: Signal) -> None:
        self._signals.append(signal)

    def extend(self, signals: Iterable[Signal]) -> None:
        self._signals.extend(signals)

    def all(self) -> tuple[Signal, ...]:
        return tuple(self._signals)

    def clear(self) -> None:
        self._signals.clear()

    def __len__(self) -> int:
        return len(self._signals)
