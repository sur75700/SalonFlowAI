from collections.abc import Iterable

from app.intelligence.contracts import Metric


class MetricRegistry:
    def __init__(self) -> None:
        self._metrics: dict[str, Metric] = {}

    def add(self, metric: Metric) -> None:
        if metric.key in self._metrics:
            raise ValueError(f"Duplicate metric key: {metric.key}")

        self._metrics[metric.key] = metric

    def extend(self, metrics: Iterable[Metric]) -> None:
        for metric in metrics:
            self.add(metric)

    def get(self, key: str) -> Metric | None:
        return self._metrics.get(key)

    def all(self) -> tuple[Metric, ...]:
        return tuple(self._metrics.values())

    def clear(self) -> None:
        self._metrics.clear()

    def __len__(self) -> int:
        return len(self._metrics)
