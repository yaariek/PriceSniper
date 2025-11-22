from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any

class CreateBidRequest(BaseModel):
    address: str
    region: str
    job_type: Literal["roof_repair", "bathroom_remodel", "electrical_rewire", "general_renovation", "other"]
    
    # NEW: Detailed job information
    job_description: str  # Detailed description of work needed
    scope_of_work: Optional[str] = None  # Specific tasks to be done
    known_issues: Optional[List[str]] = None  # List of specific problems
    complications: Optional[List[str]] = None  # Asbestos, access, structural, etc.
    urgency: Optional[Literal["low", "medium", "high", "emergency"]] = "medium"
    
    lead_channel: Optional[str] = None
    notes: Optional[str] = None
    desired_margin_percent: float

class PropertyContext(BaseModel):
    # Property details
    property_year_built: Optional[int] = None
    year_built_confidence: Optional[Literal["exact", "estimated", "inferred", "unknown"]] = "unknown"
    architectural_period: Optional[str] = None  # "Victorian", "Edwardian", etc.
    
    # NEW: Property characteristics
    property_type: Optional[Literal["flat", "terraced", "semi_detached", "detached", "bungalow", "other"]] = None
    property_size_sqm: Optional[float] = None
    number_of_bedrooms: Optional[int] = None
    number_of_floors: Optional[int] = None
    
    # Market data
    last_sale_price: Optional[float] = None
    last_sale_date: Optional[str] = None
    ownership_duration_years: Optional[float] = None
    neighbourhood_price_median: Optional[float] = None
    neighbourhood_price_trend: Optional[str] = None
    estimated_value: Optional[float] = None
    
    # Planning & regulations
    zoning: Optional[str] = None
    permits: List[Dict[str, str]] = []
    likely_risk_flags: List[str] = []
    
    # Cost indicators
    material_cost_band: str
    labour_rate_band: str
    detected_labour_rate: Optional[float] = None

class MaterialLineItem(BaseModel):
    item: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float

class LabourTask(BaseModel):
    task: str
    hours: float
    workers: int = 1
    skill_level: Optional[str] = None

class PricingBands(BaseModel):
    win_at_all_costs: float
    balanced: float
    premium: float

class PricingOutput(BaseModel):
    internal_cost_estimate: float
    price_bands: PricingBands
    min_recommended_price: float
    
    # NEW: Detailed breakdowns
    materials_breakdown: Optional[List[MaterialLineItem]] = None
    labour_breakdown: Optional[List[LabourTask]] = None
    total_materials_cost: Optional[float] = None
    total_labour_cost: Optional[float] = None

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
    # New itemized breakdown fields
    materials_breakdown: Optional[List[MaterialLineItem]] = None
    labour_breakdown: Optional[List[LabourTask]] = None
    total_materials_cost: Optional[float] = None
    total_labour_cost: Optional[float] = None

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
