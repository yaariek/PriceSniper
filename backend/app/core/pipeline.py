import uuid
import time
import logging
from app.models.schemas import CreateBidRequest, BidResponse
from app.models.entities import BidSession, bid_store
from app.services.valyu_client import ValyuClient
from app.services.context_optimizer import ContextOptimizer
from app.services.pricing_engine import PricingEngine
from app.services.llm_client import LLMClient
from app.services.regional_rates import get_regional_labour_rate

logger = logging.getLogger(__name__)

class BidPipeline:
    def __init__(self):
        self.valyu = ValyuClient()
        self.optimizer = ContextOptimizer()
        self.pricing = PricingEngine()
        self.llm = LLMClient()

    async def run_full_bid(self, request: CreateBidRequest) -> BidResponse:
        start_time = time.time()
        bid_id = str(uuid.uuid4())
        
        logger.info(f"[{bid_id}] Starting bid generation for {request.address}")
        
        # 1. Multiple Valyu Searches in parallel
        import asyncio
        
        step_start = time.time()
        property_results, market_results = await asyncio.gather(
            self.valyu.search_property_details(request.address, request.region),
            self.valyu.search_market_rates(request.region, request.job_type)
        )
        logger.info(f"[{bid_id}] Valyu searches completed in {time.time() - step_start:.2f}s")
        
        # Combine results for context optimization
        raw_results = property_results + market_results
        
        # 2. Detect labour rate (with caching)
        step_start = time.time()
        labour_rate = await self.valyu.search_labour_rates(request.region, request.job_type)
        
        if not labour_rate:
            # Use regional default based on address/postcode
            labour_rate = get_regional_labour_rate(request.address, request.region)
            logger.info(f"[{bid_id}] Using regional default labour rate: £{labour_rate}/hr")
        else:
            logger.info(f"[{bid_id}] Detected labour rate: £{labour_rate}/hr in {time.time() - step_start:.2f}s")

        # 3. Context Optimization
        step_start = time.time()
        job_info = request.model_dump()
        context = await self.optimizer.optimize(raw_results, job_info)
        context.detected_labour_rate = labour_rate
        logger.info(f"[{bid_id}] Context optimization completed in {time.time() - step_start:.2f}s")

        # 4. AI Estimation
        step_start = time.time()
        estimates = await self.llm.estimate_job_parameters(context, job_info)
        logger.info(f"[{bid_id}] AI estimation completed in {time.time() - step_start:.2f}s")

        # 5. Pricing Engine
        pricing_output = self.pricing.calculate_pricing(
            context, 
            request.job_type, 
            labour_rate,  # Use detected labour rate
            request.desired_margin_percent,
            estimates.get("base_hours", 0),
            estimates.get("materials_cost", 0)
        )

        # 6. LLM Generations (parallel execution for speed)
        step_start = time.time()
        dossier, explanation, proposal, followups = await asyncio.gather(
            self.llm.generate_dossier(context, job_info),
            self.llm.generate_pricing_explanation(context, pricing_output),
            self.llm.generate_proposal(context, pricing_output, job_info, request.notes or ""),
            self.llm.generate_followups(context, pricing_output, job_info)
        )
        logger.info(f"[{bid_id}] LLM generations completed in {time.time() - step_start:.2f}s (parallel)")

        # 7. Construct Response
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
        
        total_time = time.time() - start_time
        logger.info(f"[{bid_id}] Bid generation completed in {total_time:.2f}s")

        return response
