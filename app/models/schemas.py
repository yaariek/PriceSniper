from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any

class CreateBidRequest(BaseModel):
    address: str
    region: str
    job_type: Literal["roof_repair", "bathroom_remodel", "electrical_rewire", "general_renovation", "other"]
    lead_channel: Optional[str] = None
    notes: Optional[str] = None
    desired_margin_percent: float

class PropertyContext(BaseModel):
    property_year_built: Optional[int] = None
    last_sale_price: Optional[float] = None
    last_sale_date: Optional[str] = None
    ownership_duration_years: Optional[float] = None
    neighbourhood_price_median: Optional[float] = None
    neighbourhood_price_trend: Optional[str] = None
    estimated_value: Optional[float] = None
    zoning: Optional[str] = None
    permits: List[Dict[str, str]] = []
    likely_risk_flags: List[str] = []
    material_cost_band: str
    labour_rate_band: str
    detected_labour_rate: Optional[float] = None

class PricingBands(BaseModel):
    win_at_all_costs: float
    balanced: float
    premium: float

class PricingOutput(BaseModel):
    internal_cost_estimate: float
    price_bands: PricingBands
    min_recommended_price: float

class FollowUpScripts(BaseModel):
    email_d2: str
    email_d7: str
    price_objection_script: str

class BidResponse(BaseModel):
    bid_id: str
    property_context: PropertyContext
    pricing: PricingOutput
    dossier_text: str
    pricing_explanation: str
    proposal_draft: str
    followup: FollowUpScripts
    raw_valyu_results: List[Dict[str, Any]] = []

class VoiceTokenRequest(BaseModel):
    room_name: str
    identity: str

class VoiceTokenResponse(BaseModel):
    token: str
    url: str

class VoiceCoachRequest(BaseModel):
    bid_id: str
    message: str

class VoiceCoachResponse(BaseModel):
    reply: str
