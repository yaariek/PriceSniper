from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import CreateBidRequest, BidResponse
from app.models.entities import bid_store
from app.core.pipeline import BidPipeline

router = APIRouter(prefix="/bids", tags=["bids"])

def get_pipeline():
    return BidPipeline()

@router.post("", response_model=BidResponse)
async def create_bid(request: CreateBidRequest, pipeline: BidPipeline = Depends(get_pipeline)):
    try:
        return await pipeline.run_full_bid(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{bid_id}", response_model=BidResponse)
async def get_bid(bid_id: str):
    if bid_id not in bid_store:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid_store[bid_id].data
