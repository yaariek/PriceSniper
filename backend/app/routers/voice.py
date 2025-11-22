from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import VoiceTokenRequest, VoiceTokenResponse, VoiceCoachRequest, VoiceCoachResponse
from app.models.entities import bid_store
from app.services.livekit_client import LiveKitClient
from app.services.llm_client import LLMClient

router = APIRouter(prefix="/voice", tags=["voice"])

def get_livekit():
    return LiveKitClient()

def get_llm():
    return LLMClient()

@router.post("/token", response_model=VoiceTokenResponse)
async def get_token(request: VoiceTokenRequest, livekit: LiveKitClient = Depends(get_livekit)):
    try:
        token = livekit.create_token(request.room_name, request.identity)
        return VoiceTokenResponse(token=token, url=livekit.get_url())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/coach", response_model=VoiceCoachResponse)
async def coach_contractor(request: VoiceCoachRequest, llm: LLMClient = Depends(get_llm)):
    if request.bid_id not in bid_store:
        raise HTTPException(status_code=404, detail="Bid context not found")
    
    bid_session = bid_store[request.bid_id]
    # Serialize relevant context for the LLM
    context_summary = f"Job Type: {bid_session.data.property_context.model_dump_json()}" 
    
    try:
        reply = await llm.generate_coaching(context_summary, request.message)
        return VoiceCoachResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
