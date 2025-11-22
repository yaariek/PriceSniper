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
        system = "You are a pricing strategist. Explain the pricing logic to the contractor (internal use)."
        user = f"Context: {context.model_dump_json()}\nPricing: {pricing.model_dump_json()}\n\nExplain why the price is set this way, highlighting risks and buffers."
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
        system = "You are an expert construction estimator. Analyze the property context and local market data to estimate job costs."
        user = f"""
        Context: {context.model_dump_json()}
        Job: {job_info}
        
        Estimate the 'base_hours' (labour hours) and 'materials_cost' (in GBP) for this specific job.
        Consider the property age, condition, and local market rates if available.
        
        Output ONLY a valid JSON object with keys: "base_hours" (float) and "materials_cost" (float).
        Example: {{"base_hours": 24.5, "materials_cost": 1200.0}}
        """
        
        response_text = await self._generate(system, user)
        
        # Simple parsing attempt
        import json
        import re
        
        try:
            # Extract JSON from code blocks if present
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                json_str = match.group(0)
                return json.loads(json_str)
            else:
                return json.loads(response_text)
        except Exception as e:
            print(f"Failed to parse LLM estimation: {e}. Using defaults.")
            return {"base_hours": 20.0, "materials_cost": 1000.0}
