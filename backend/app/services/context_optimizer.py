from typing import List, Dict, Any
from app.models.schemas import PropertyContext
from openai import AsyncOpenAI
from app.config import settings
import json

class ContextOptimizer:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key and "sk-" in self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
    
    async def optimize(self, raw_results: List[Dict[str, Any]], job_info: Dict[str, Any]) -> PropertyContext:
        """
        Use LLM to extract structured property context from raw Valyu search results.
        Falls back to heuristic extraction if LLM is not available.
        """
        
        if not self.client:
            print("OpenAI client not available. Using heuristic extraction.")
            return self._heuristic_optimize(raw_results, job_info)
        
        try:
            # Prepare the raw data for LLM
            raw_data_text = self._format_raw_results(raw_results)
            
            # Create extraction prompt
            system_prompt = """You are an expert property data analyst. Your goal is to extract specific property details from search results.
            
            Extract the following fields into a JSON object:
            - property_year_built: integer (e.g. 1930). Be aggressive in inferring this from "Victorian" (1837-1901 -> ~1870), "Edwardian" (1901-1910 -> ~1905), "1930s" -> 1935.
            - year_built_confidence: "exact", "estimated", "inferred", "unknown"
            - architectural_period: string (e.g. "Victorian", "Post-war")
            - property_type: "flat", "terraced", "semi_detached", "detached", "bungalow", "other"
            - property_size_sqm: float (convert sqft to sqm if needed: sqft * 0.0929)
            - number_of_bedrooms: integer
            - number_of_floors: integer
            - last_sale_price: float
            - last_sale_date: string (YYYY-MM-DD)
            - estimated_value: float
            - neighbourhood_price_median: float
            - neighbourhood_price_trend: "up", "down", "stable"
            - material_cost_band: "budget", "medium", "premium" (infer from property value/type)
            - labour_rate_band: "budget", "medium", "premium" (infer from location/value)
            
            If exact year is not found but period is known (e.g. Victorian), estimate the year and set confidence to "inferred".
            If property type is ambiguous, look for clues like "floor" (flat), "shared wall" (semi/terrace).
            """

            user_prompt = f"""Extract property context from these search results:

{raw_data_text}

Job Type: {job_info.get('job_type', 'unknown')}
Address: {job_info.get('address', 'unknown')}

CRITICAL: Focus on finding the year built - check ALL results for any mention of age, period, or construction date.
Also determine the property type (flat, house type, etc.) from context clues.

Return ONLY valid JSON matching the schema."""

            # Call OpenAI with JSON mode
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            # Parse the response
            extracted_data = json.loads(response.choices[0].message.content)
            
            # Ensure required fields have defaults
            if not extracted_data.get("material_cost_band"):
                extracted_data["material_cost_band"] = "medium"
            if not extracted_data.get("labour_rate_band"):
                extracted_data["labour_rate_band"] = "medium"
            
            # Create PropertyContext from extracted data
            context = PropertyContext(
                # Property details
                property_year_built=extracted_data.get("property_year_built"),
                year_built_confidence=extracted_data.get("year_built_confidence", "unknown"),
                architectural_period=extracted_data.get("architectural_period"),
                property_type=extracted_data.get("property_type"),
                property_size_sqm=extracted_data.get("property_size_sqm"),
                number_of_bedrooms=extracted_data.get("number_of_bedrooms"),
                number_of_floors=extracted_data.get("number_of_floors"),
                
                # Market data
                last_sale_price=extracted_data.get("last_sale_price"),
                last_sale_date=extracted_data.get("last_sale_date"),
                ownership_duration_years=extracted_data.get("ownership_duration_years"),
                neighbourhood_price_median=extracted_data.get("neighbourhood_price_median"),
                neighbourhood_price_trend=extracted_data.get("neighbourhood_price_trend"),
                estimated_value=extracted_data.get("estimated_value"),
                
                # Planning & risk
                zoning=extracted_data.get("zoning"),
                permits=extracted_data.get("permits", []),
                likely_risk_flags=extracted_data.get("likely_risk_flags", []),
                
                # Cost indicators
                material_cost_band=extracted_data.get("material_cost_band", "medium"),
                labour_rate_band=extracted_data.get("labour_rate_band", "medium")
            )
            
            print(f"LLM extracted context: year={context.property_year_built} ({context.year_built_confidence}), type={context.property_type}, period={context.architectural_period}")
            return context
            
        except Exception as e:
            print(f"LLM extraction failed: {e}. Falling back to heuristic extraction.")
            return self._heuristic_optimize(raw_results, job_info)
    
    def _format_raw_results(self, raw_results: List[Dict[str, Any]]) -> str:
        """Format raw Valyu results into text for LLM processing"""
        formatted = []
        for i, result in enumerate(raw_results[:10], 1):  # Limit to first 10 results
            title = result.get("title", "")
            # Use full_content if available, otherwise use snippet
            content = result.get("raw_metadata", {}).get("full_content", "") or result.get("snippet", "")
            # Truncate very long content to avoid token limits (keep first 2000 chars per result)
            content = content[:2000] if content else ""
            url = result.get("url", "")
            formatted.append(f"Result {i}:\nTitle: {title}\nContent: {content}\nURL: {url}\n")
        return "\n".join(formatted)
    
    def _heuristic_optimize(self, raw_results: List[Dict[str, Any]], job_info: Dict[str, Any]) -> PropertyContext:
        """Fallback heuristic extraction (original logic)"""
        context = PropertyContext(
            material_cost_band="medium",
            labour_rate_band="medium"
        )

        for doc in raw_results:
            meta = doc.get("raw_metadata", {})
            snippet = doc.get("snippet", "").lower()

            if "year_built" in meta:
                context.property_year_built = meta["year_built"]
            
            if "last_sale_price" in meta:
                context.last_sale_price = float(meta["last_sale_price"])
            
            if "last_sale_date" in meta:
                context.last_sale_date = meta["last_sale_date"]
                # simplistic ownership duration
                try:
                    sale_year = int(meta["last_sale_date"].split("-")[0])
                    import datetime
                    current_year = datetime.datetime.now().year
                    context.ownership_duration_years = float(current_year - sale_year)
                except:
                    pass

            if "median_price" in meta:
                context.neighbourhood_price_median = float(meta["median_price"])
            
            if "trend" in meta:
                context.neighbourhood_price_trend = meta["trend"]

            if "estimated_value" in meta:
                context.estimated_value = float(meta["estimated_value"])

            if "zoning" in meta:
                context.zoning = meta["zoning"]

            if "permits" in meta and isinstance(meta["permits"], list):
                # Normalize permits
                for p in meta["permits"]:
                    context.permits.append({"type": str(p.get("type", "unknown")), "year": str(p.get("year", "unknown"))})

        # Heuristic risk flags
        if context.property_year_built and context.property_year_built < 1970:
            context.likely_risk_flags.append("Old wiring/plumbing risk")
            context.material_cost_band = "high" # Older homes might need custom fits

        # Check for high value property/area (adjusted for London market)
        high_value_threshold = 600000  # £600k for London
        is_high_value = False
        
        if context.neighbourhood_price_median and context.neighbourhood_price_median > high_value_threshold:
            is_high_value = True
        elif context.estimated_value and context.estimated_value > high_value_threshold:
            is_high_value = True

        if is_high_value:
            context.labour_rate_band = "high" # Wealthier area, higher expectations

        return context
