from datetime import UTC, date, datetime, time, timedelta
from typing import Any, Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.api.deps import require_auth
from app.db.mongo import get_database
from app.intelligence.capacity import CapacityDataUnavailable
from app.intelligence.authoritative_capacity_source import (
    AUTHORITATIVE_CAPACITY_SOURCE,
    AuthoritativeCapacitySource,
)
from app.intelligence.capacity_baseline_source import (
    prepare_capacity_context,
)
from app.intelligence.context import IntelligenceContext
from app.intelligence.decision_serializer import (
    serialize_intelligence_decision,
)
from app.intelligence.factory import (
    create_provider_family_intelligence_service,
)
from app.intelligence.models import AnalysisWindow
from app.intelligence.service import IntelligenceService
from app.services.entitlements import (
    EntitlementSourceUnavailable,
    FeatureNotEntitled,
    require_feature_entitlement,
)
from app.observability.events import instrument_intelligence_decision


router = APIRouter()

CAPACITY_SOURCE_LABEL = AUTHORITATIVE_CAPACITY_SOURCE


class AnalysisWindowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start: date
    end: date
    label: str = Field(
        default="current",
        min_length=1,
        max_length=64,
    )

    @field_validator("label")
    @classmethod
    def normalize_label(
        cls,
        value: str,
    ) -> str:
        normalized = value.strip()

        if not normalized:
            raise ValueError(
                "window label is required"
            )

        return normalized

    @model_validator(mode="after")
    def validate_range(
        self,
    ) -> "AnalysisWindowRequest":
        if self.start > self.end:
            raise ValueError(
                "window start cannot be after end"
            )

        return self


class IntelligenceDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=8,
    )

    window: AnalysisWindowRequest

    @field_validator("currency")
    @classmethod
    def normalize_currency(
        cls,
        value: str,
    ) -> str:
        normalized = value.strip().upper()

        if (
            not normalized.isascii()
            or not normalized.isalpha()
            or not 3 <= len(normalized) <= 8
        ):
            raise ValueError(
                "currency must contain 3 to 8 "
                "ASCII letters"
            )

        return normalized


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str
    description: str
    value: Any | None = None
    observed_at: str


class SignalResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    title: str
    description: str

    severity: Literal[
        "info",
        "opportunity",
        "warning",
        "critical",
    ]

    evidence: list[EvidenceResponse]


class MetricResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: str
    value: float
    unit: str | None = None
    comparison_value: float | None = None


class ExpectedImpactResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    metric: str
    estimated_change: float
    unit: str
    timeframe_days: int


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    title: str
    description: str
    priority: int

    expected_impacts: list[
        ExpectedImpactResponse
    ]


class ConfidenceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: float

    level: Literal[
        "low",
        "medium",
        "high",
    ]

    explanation: str
    evidence_count: int


class IntelligenceDecisionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    owner_id: str
    summary: str
    signals: list[SignalResponse]
    metrics: list[MetricResponse]

    recommendations: list[
        RecommendationResponse
    ]

    confidence: ConfidenceResponse
    generated_at: str


def get_intelligence_service(
) -> IntelligenceService:
    """
    Construct the production provider-family service.

    Construction performs no database I/O. Mongo providers read data
    only when IntelligenceService.analyze() executes.
    """

    return (
        create_provider_family_intelligence_service()
    )


INTELLIGENCE_FEATURE = "advanced_ai"
FEATURE_NOT_ENTITLED_CODE = "feature_not_entitled"
ENTITLEMENT_SOURCE_UNAVAILABLE_CODE = (
    "entitlement_source_unavailable"
)


async def require_advanced_ai_entitlement(
    auth: dict = Depends(require_auth),
) -> None:
    owner_id = _authenticated_owner(auth)
    database = get_database()

    try:
        await require_feature_entitlement(
            database=database,
            owner_id=owner_id,
            feature=INTELLIGENCE_FEATURE,
        )
    except FeatureNotEntitled:
        raise HTTPException(
            status_code=403,
            detail={
                "code": FEATURE_NOT_ENTITLED_CODE,
                "feature": INTELLIGENCE_FEATURE,
            },
        ) from None
    except EntitlementSourceUnavailable:
        raise HTTPException(
            status_code=503,
            detail={
                "code": ENTITLEMENT_SOURCE_UNAVAILABLE_CODE,
                "feature": INTELLIGENCE_FEATURE,
            },
        ) from None


def _window_period(
    window: AnalysisWindow,
) -> tuple[datetime, datetime]:
    """
    Translate an inclusive date window into UTC half-open boundaries.
    """

    period_start = datetime.combine(
        window.start,
        time.min,
        tzinfo=UTC,
    )

    period_end = datetime.combine(
        window.end + timedelta(days=1),
        time.min,
        tzinfo=UTC,
    )

    return period_start, period_end


def _authenticated_owner(
    auth: object,
) -> str:
    owner_id = (
        auth.get("admin_id")
        if isinstance(auth, dict)
        else None
    )

    if (
        not isinstance(owner_id, str)
        or not ObjectId.is_valid(owner_id)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    return owner_id


def _runtime_http_exception(
    error: RuntimeError,
) -> HTTPException:
    message = str(error)

    if message == "Database not connected":
        return HTTPException(
            status_code=503,
            detail="Intelligence service unavailable",
        )

    if "owner does not match" in message:
        return HTTPException(
            status_code=500,
            detail=(
                "Intelligence tenant validation failed"
            ),
        )

    return HTTPException(
        status_code=500,
        detail="Intelligence execution failed",
    )


@router.post(
    "/decision",
    response_model=IntelligenceDecisionResponse,
)
@instrument_intelligence_decision
async def create_intelligence_decision(
    payload: IntelligenceDecisionRequest,
    auth: dict = Depends(require_auth),
    _entitlement: None = Depends(
        require_advanced_ai_entitlement
    ),
    service: IntelligenceService = Depends(
        get_intelligence_service
    ),
) -> dict[str, Any]:
    owner_id = _authenticated_owner(auth)

    try:
        window = AnalysisWindow(
            start=payload.window.start,
            end=payload.window.end,
            label=payload.window.label,
        )

        context = IntelligenceContext(
            owner_id=owner_id,
            locale="en",
            timezone="UTC",
            currency=payload.currency,
            window=window,
        )

        period_start, period_end = (
            _window_period(window)
        )

        database = get_database()
        if database is None:
            raise RuntimeError("Database not connected")

        context = await prepare_capacity_context(
            context=context,
            source=AuthoritativeCapacitySource(
                database=database,
                period_start=period_start,
                period_end=period_end,
            ),
        )

        decision = await service.analyze(
            context=context
        )

        return serialize_intelligence_decision(
            decision,
            expected_owner_id=owner_id,
        )

    except CapacityDataUnavailable as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from None

    except RuntimeError as error:
        raise _runtime_http_exception(
            error
        ) from None

    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from None
