from typing import List, Dict, Any
from app.models.schemas import PropertyContext

class ContextOptimizer:
    def optimize(self, raw_results: List[Dict[str, Any]], job_info: Dict[str, Any]) -> PropertyContext:
        # Heuristic extraction from raw results
        # In a real app, this would be more robust parsing or use a small LLM call
        
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

            if "permits" in meta and isinstance(meta["permits"], list):
                # Normalize permits
                for p in meta["permits"]:
                    context.permits.append({"type": str(p.get("type", "unknown")), "year": str(p.get("year", "unknown"))})

        # Heuristic risk flags
        if context.property_year_built and context.property_year_built < 1970:
            context.likely_risk_flags.append("Old wiring/plumbing risk")
            context.material_cost_band = "high" # Older homes might need custom fits

        if context.neighbourhood_price_median and context.neighbourhood_price_median > 800000:
            context.labour_rate_band = "high" # Wealthier area, higher expectations

        return context
