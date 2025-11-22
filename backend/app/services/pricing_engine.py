from app.models.schemas import PropertyContext, PricingOutput, PricingBands

class PricingEngine:
    def calculate_pricing(self, context: PropertyContext, job_type: str, labour_rate: float, desired_margin: float, estimated_hours: float, estimated_materials: float) -> PricingOutput:
        # Deterministic logic based on AI inputs
        
        base_hours = estimated_hours
        materials_cost = estimated_materials

        # Adjust for context
        risk_multiplier = 1.0
        if "Old wiring/plumbing risk" in context.likely_risk_flags:
            risk_multiplier += 0.15 # 15% buffer
        
        if context.material_cost_band == "high":
            materials_cost *= 1.3
        elif context.material_cost_band == "low":
            materials_cost *= 0.9

        # Calculate internal cost
        adjusted_labour_rate = labour_rate
        if context.labour_rate_band == "high":
            adjusted_labour_rate *= 1.2 # 20% premium for high-end expectations

        labour_cost = base_hours * adjusted_labour_rate
        internal_cost = (labour_cost + materials_cost) * risk_multiplier

        # Calculate bands
        # Win at all costs: 15% margin
        # Balanced: desired margin
        # Premium: desired margin + 15%
        
        def price_with_margin(cost, margin):
            return cost / (1 - margin)

        win_margin = 0.15
        premium_margin = desired_margin + 0.15

        win_price = price_with_margin(internal_cost, win_margin)
        balanced_price = price_with_margin(internal_cost, desired_margin)
        premium_price = price_with_margin(internal_cost, premium_margin)

        return PricingOutput(
            internal_cost_estimate=round(internal_cost, 2),
            price_bands=PricingBands(
                win_at_all_costs=round(win_price, 2),
                balanced=round(balanced_price, 2),
                premium=round(premium_price, 2)
            ),
            min_recommended_price=round(win_price, 2)
        )
