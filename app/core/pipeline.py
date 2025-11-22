import uuid
from app.models.schemas import CreateBidRequest, BidResponse
from app.models.entities import BidSession, bid_store
from app.services.valyu_client import ValyuClient
from app.services.context_optimizer import ContextOptimizer
from app.services.pricing_engine import PricingEngine
from app.services.llm_client import LLMClient

class BidPipeline:
    def __init__(self):
        self.valyu = ValyuClient()
        self.optimizer = ContextOptimizer()
        self.pricing = PricingEngine()
        self.llm = LLMClient()

    async def run_full_bid(self, request: CreateBidRequest) -> BidResponse:
        # 1. Valyu Search
        raw_results = await self.valyu.search_property_and_neighbourhood(
            request.address, request.region, request.job_type
        )

        # 2. Context Optimization
        job_info = request.model_dump()
        context = self.optimizer.optimize(raw_results, job_info)

        # 3. Pricing Engine
        pricing_output = self.pricing.calculate_pricing(
            context, 
            request.job_type, 
            request.labour_rate, 
            request.desired_margin_percent
        )

        # 4. LLM Generations
        # Run these in parallel in a real app, but sequential here for simplicity/clarity
        dossier = await self.llm.generate_dossier(context, job_info)
        explanation = await self.llm.generate_pricing_explanation(context, pricing_output)
        proposal = await self.llm.generate_proposal(context, pricing_output, job_info, request.notes or "")
        followups = await self.llm.generate_followups(context, pricing_output, job_info)

        # 5. Construct Response
        bid_id = str(uuid.uuid4())
        response = BidResponse(
            bid_id=bid_id,
            property_context=context,
            pricing=pricing_output,
            dossier_text=dossier,
            pricing_explanation=explanation,
            proposal_draft=proposal,
            followup=followups
        )

        # 6. Store
        bid_store[bid_id] = BidSession(id=bid_id, data=response)

        return response
