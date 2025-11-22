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
        # 1. Multiple Valyu Searches in parallel
        import asyncio
        
        property_results, market_results = await asyncio.gather(
            self.valyu.search_property_details(request.address, request.region),
            self.valyu.search_market_rates(request.region, request.job_type)
        )
        
        # Combine results for context optimization
        raw_results = property_results + market_results
        
        # 2. Detect labour rate (with caching)
        labour_rate = await self.valyu.search_labour_rates(request.region, request.job_type)
        
        if not labour_rate:
            # Fallback to default if detection fails
            labour_rate = 65.0  # Default £65/hr for London
            print(f"Using default labour rate: £{labour_rate}/hr")

        # 3. Context Optimization
        job_info = request.model_dump()
        context = await self.optimizer.optimize(raw_results, job_info)
        context.detected_labour_rate = labour_rate

        # 4. AI Estimation
        estimates = await self.llm.estimate_job_parameters(context, job_info)

        # 5. Pricing Engine
        pricing_output = self.pricing.calculate_pricing(
            context, 
            request.job_type, 
            labour_rate,  # Use detected labour rate
            request.desired_margin_percent,
            estimates.get("base_hours", 0),
            estimates.get("materials_cost", 0)
        )

        # 6. LLM Generations
        # Run these in parallel in a real app, but sequential here for simplicity/clarity
        dossier = await self.llm.generate_dossier(context, job_info)
        explanation = await self.llm.generate_pricing_explanation(context, pricing_output)
        proposal = await self.llm.generate_proposal(context, pricing_output, job_info, request.notes or "")
        followups = await self.llm.generate_followups(context, pricing_output, job_info)

        # 7. Construct Response
        bid_id = str(uuid.uuid4())
        response = BidResponse(
            bid_id=bid_id,
            property_context=context,
            pricing=pricing_output,
            dossier_text=dossier,
            pricing_explanation=explanation,
            proposal_draft=proposal,
            followup=followups,
            raw_valyu_results=raw_results
        )

        # 8. Store
        bid_store[bid_id] = BidSession(id=bid_id, data=response)

        return response
