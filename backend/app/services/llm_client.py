from openai import AsyncOpenAI
from app.config import settings
from app.models.schemas import PropertyContext, PricingOutput, FollowUpScripts

class LLMClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key and "sk-" in self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def _generate(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            return "[MOCK] OpenAI API Key missing. This is generated text."
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo", # Or gpt-4 if available/preferred
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI call failed: {e}")
            return f"[ERROR] Failed to generate text: {e}"

    async def generate_dossier(self, context: PropertyContext, job_info: dict) -> str:
        system = "You are an expert construction estimator assistant. Create a pre-meeting dossier for a contractor."
        user = f"Context: {context.model_dump_json()}\nJob: {job_info}\n\nSummarize the property history, neighbourhood vibe, and key talking points."
        return await self._generate(system, user)

    async def generate_pricing_explanation(self, context: PropertyContext, pricing: PricingOutput) -> str:
        system = """You are a pricing strategist for construction contractors. Create a UNIQUE, LOCATION-SPECIFIC explanation of the pricing strategy.

DO NOT use generic templates. Customize based on:
- The specific property location and characteristics
- Local market conditions
- Property age and type
- Identified risks and complications

Be conversational and specific to THIS property."""

        # Extract location context
        location_context = f"""
PROPERTY DETAILS:
- Type: {context.property_type or 'unknown'}
- Year Built: {context.property_year_built or 'unknown'} ({context.architectural_period or 'unknown period'})
- Size: {context.property_size_sqm or 'unknown'} sqm, {context.number_of_bedrooms or 'unknown'} bedrooms

MARKET CONTEXT:
- Neighbourhood Median Price: £{context.neighbourhood_price_median or 'unknown'}
- Price Trend: {context.neighbourhood_price_trend or 'unknown'}
- Labour Rate: £{context.detected_labour_rate or 65}/hr

RISK FACTORS:
{', '.join(context.likely_risk_flags) if context.likely_risk_flags else 'None identified'}

PRICING:
- Internal Cost: £{pricing.internal_cost_estimate}
- Win Price: £{pricing.price_bands.win_at_all_costs}
- Balanced: £{pricing.price_bands.balanced}
- Premium: £{pricing.price_bands.premium}
"""

        user = f"""{location_context}

Explain the pricing strategy for THIS SPECIFIC property. Address:
1. Why the internal cost is what it is (property-specific factors)
2. How the local market affects pricing (neighbourhood trends, labour rates)
3. What risks were factored in (age, type, complications)
4. Why each pricing tier makes sense for THIS location

Make it conversational and specific - mention the property type, area characteristics, etc.
Keep it under 200 words."""

        return await self._generate(system, user)

    async def generate_proposal(self, context: PropertyContext, pricing: PricingOutput, job_info: dict, notes: str) -> str:
        system = "You are a professional copywriter for construction proposals. Write a persuasive proposal for the homeowner."
        user = f"Job: {job_info}\nNotes: {notes}\nPrice: £{pricing.price_bands.balanced}\n\nWrite a friendly, professional proposal."
        return await self._generate(system, user)

    async def generate_followups(self, context: PropertyContext, pricing: PricingOutput, job_info: dict) -> FollowUpScripts:
        system = "You are a sales coach. Generate follow-up scripts."
        user = f"Job: {job_info}\nPrice: £{pricing.price_bands.balanced}\n\nGenerate 3 scripts: 1) Email 2 days later, 2) Email 7 days later, 3) Script for handling 'too expensive' objection."
        
        # In a real app, we might use function calling or JSON mode to get structured output.
        # For now, we'll just ask for a combined string and parse it or just return raw text in fields for simplicity if parsing is hard.
        # To keep it robust without complex parsing logic, I'll make 3 separate calls or just return the big blob in one field if the schema allowed.
        # The schema expects specific fields. I will do a simple split or just put the whole text in one if I can't parse.
        # Actually, let's just do 3 simple calls to ensure structure, or one call and heuristic split. 3 calls is safer for this demo.
        
        email_d2 = await self._generate(system, user + "\n\nOutput ONLY the Day 2 Email body.")
        email_d7 = await self._generate(system, user + "\n\nOutput ONLY the Day 7 Email body.")
        objection = await self._generate(system, user + "\n\nOutput ONLY the Objection Handling Script.")

        return FollowUpScripts(
            email_d2=email_d2,
            email_d7=email_d7,
            price_objection_script=objection
        )

    async def generate_coaching(self, bid_context: str, message: str) -> str:
        system = "You are a real-time negotiation coach for a contractor."
        user = f"Bid Context: {bid_context}\nUser Message/Situation: {message}\n\nGive short, actionable advice."
        return await self._generate(system, user)

    async def estimate_job_parameters(self, context: PropertyContext, job_info: dict) -> dict:
        system = """You are an expert construction cost estimator specializing in UK repair and renovation work.

CRITICAL: You are estimating the cost of a REPAIR JOB based on the detailed job description provided.
- Property values are for context only
- DO NOT use property sale prices as repair costs
- Focus on the SPECIFIC WORK DESCRIBED in the job description"""

        job_type = job_info.get('job_type', 'unknown')
        job_description = job_info.get('job_description', '')
        scope_of_work = job_info.get('scope_of_work', '')
        known_issues = job_info.get('known_issues', [])
        complications = job_info.get('complications', [])
        urgency = job_info.get('urgency', 'medium')
        
        user = f"""
JOB DETAILS:
Type: {job_type}
Description: {job_description}
Scope of Work: {scope_of_work or 'Not specified'}
Known Issues: {', '.join(known_issues) if known_issues else 'None specified'}
Complications: {', '.join(complications) if complications else 'None'}
Urgency: {urgency}

PROPERTY CONTEXT (for reference only):
- Property Type: {context.property_type or 'unknown'}
- Year Built: {context.property_year_built or 'unknown'} ({context.architectural_period or 'unknown period'})
- Size: {context.property_size_sqm or 'unknown'} sqm
- Bedrooms: {context.number_of_bedrooms or 'unknown'}
- Material Cost Band: {context.material_cost_band}
- Labour Rate Band: {context.labour_rate_band}

Based on the DETAILED JOB DESCRIPTION above, provide:

1. LABOUR BREAKDOWN - List each specific task with estimated hours:
   Example: [{{"task": "Remove damaged tiles", "hours": 2, "workers": 1, "skill_level": "roofer"}}]

2. MATERIALS BREAKDOWN - Itemized list with quantities and costs:
   Example: [{{"item": "Roof tiles", "quantity": 25, "unit": "tiles", "unit_cost": 10, "total_cost": 250}}]

IMPORTANT RULES:
- Break down the job into specific tasks from the description
- Account for complications (add 20-30% time for difficult access, asbestos, etc.)
- Urgency affects hours: emergency = +30%, high = +15%, medium = 0%, low = -10%
- If materials_cost > £50,000, you've made an error
- If total_hours > 500, you've made an error

Output ONLY valid JSON:
{{
  "labour_tasks": [
    {{"task": "Task name", "hours": <float>, "workers": <int>, "skill_level": "<string>"}}
  ],
  "materials": [
    {{"item": "Material name", "quantity": <float>, "unit": "<string>", "unit_cost": <float>, "total_cost": <float>}}
  ],
  "base_hours": <float>,
  "materials_cost": <float>,
  "complexity_multiplier": <float>,
  "urgency_multiplier": <float>
}}
"""
        
        response_text = await self._generate(system, user)
        
        import json
        import re
        
        try:
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                json_str = match.group(0)
                estimates = json.loads(json_str)
            else:
                estimates = json.loads(response_text)
            
            # Validation
            materials_cost = estimates.get("materials_cost", 3000.0)
            base_hours = estimates.get("base_hours", 30.0)
            
            if materials_cost > 50000:
                print(f"WARNING: Unrealistic materials_cost: £{materials_cost}. Using default.")
                materials_cost = 5000.0
            
            if base_hours > 500:
                print(f"WARNING: Unrealistic base_hours: {base_hours}. Using default.")
                base_hours = 40.0
            
            return {
                "base_hours": float(base_hours),
                "materials_cost": float(materials_cost),
                "labour_tasks": estimates.get("labour_tasks", []),
                "materials": estimates.get("materials", []),
                "complexity_multiplier": estimates.get("complexity_multiplier", 1.0),
                "urgency_multiplier": estimates.get("urgency_multiplier", 1.0)
            }
            
        except Exception as e:
            print(f"Failed to parse LLM estimation: {e}. Using defaults.")
            job_defaults = {
                "roof_repair": {"base_hours": 40.0, "materials_cost": 4000.0},
                "bathroom_remodel": {"base_hours": 80.0, "materials_cost": 6000.0},
                "electrical_rewire": {"base_hours": 60.0, "materials_cost": 3000.0},
                "general_renovation": {"base_hours": 100.0, "materials_cost": 8000.0},
                "other": {"base_hours": 30.0, "materials_cost": 3000.0}
            }
            default = job_defaults.get(job_type, job_defaults["other"])
            default["labour_tasks"] = []
            default["materials"] = []
            return default

