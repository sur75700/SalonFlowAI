from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.capacity.repository import CapacityRepository
from app.capacity.resolver import (
    AuthoritativeCapacityResolver,
    CapacityResolutionError,
)
from app.intelligence.capacity import (
    CapacityBaseline,
    CapacityDataUnavailable,
)
from app.intelligence.capacity_baseline_source import (
    CapacityBaselineResult,
)
from app.intelligence.context import IntelligenceContext


AUTHORITATIVE_CAPACITY_SOURCE = "authoritative_capacity_v1"


@dataclass(frozen=True, slots=True)
class AuthoritativeCapacitySource:
    database: Any
    period_start: datetime
    period_end: datetime

    async def get_capacity_baseline(
        self,
        *,
        context: IntelligenceContext,
    ) -> CapacityBaselineResult:
        if not isinstance(context, IntelligenceContext):
            raise TypeError("context must be an IntelligenceContext")
        resolver = AuthoritativeCapacityResolver(
            CapacityRepository(self.database)
        )
        try:
            result = await resolver.resolve(
                owner_id=context.owner_id,
                period_start=self.period_start,
                period_end=self.period_end,
            )
        except CapacityResolutionError as error:
            raise CapacityDataUnavailable(str(error)) from error
        if result.owner_id != context.owner_id:
            raise CapacityDataUnavailable(
                "authoritative capacity owner does not match"
            )
        return CapacityBaseline(
            owner_id=result.owner_id,
            period_start=result.period_start,
            period_end=result.period_end,
            total_slots=result.total_slots,
            active_staff_count=result.active_staff_count,
            available_minutes=result.available_minutes,
            source=AUTHORITATIVE_CAPACITY_SOURCE,
        )
