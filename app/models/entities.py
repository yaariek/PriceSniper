from pydantic import BaseModel
from typing import Optional
from app.models.schemas import BidResponse

# Simple in-memory storage for now
class BidSession(BaseModel):
    id: str
    data: BidResponse

# Global in-memory store
# Key: bid_id, Value: BidSession
bid_store: dict[str, BidSession] = {}
