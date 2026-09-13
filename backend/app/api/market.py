from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import require_auth
from app.market.contracts import MarketPulseResponse
from app.market.service import MarketPulseService, get_market_pulse_service


router = APIRouter()


@router.get("/pulse", response_model=MarketPulseResponse)
async def market_pulse(
    request: Request,
    _auth: dict = Depends(require_auth),
    service: MarketPulseService = Depends(get_market_pulse_service),
) -> MarketPulseResponse:
    if request.query_params:
        raise HTTPException(
            status_code=400,
            detail={"code": "market_pulse_query_not_supported"},
        )
    return await service.get_pulse()
