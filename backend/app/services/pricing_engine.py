from app.models.schemas import PropertyContext, PricingOutput, PricingBands, LabourTask, MaterialLineItem, MarketStats
from app.services.materials import get_material_cost
from typing import List
import random

class PricingEngine:
    def calculate_pricing(self, context: PropertyContext, job_type: str, labour_rate: float, desired_margin: float, estimated_hours: float, estimated_materials: float, labour_tasks: List[LabourTask] = None, materials: List[MaterialLineItem] = None, urgency: str = "medium") -> PricingOutput:
        # Deterministic logic based on AI inputs
        
        base_hours = estimated_hours
        materials_cost = estimated_materials

        # Adjust for context
        risk_multiplier = 1.0
        if "Old wiring/plumbing risk" in context.likely_risk_flags:
            risk_multiplier += 0.15 # 15% buffer
        
        # Adjust for urgency
        if urgency == "high":
            risk_multiplier += 0.10 # 10% premium for high urgency
        elif urgency == "emergency":
            risk_multiplier += 0.30 # 30% premium for emergency
        
        if context.material_cost_band == "high":
            materials_cost *= 1.3
        elif context.material_cost_band == "low":
            materials_cost *= 0.9

        # Calculate internal cost
        adjusted_labour_rate = labour_rate
        if context.labour_rate_band == "high":
            adjusted_labour_rate *= 1.2 # 20% premium for high-end expectations

        labour_breakdown = labour_tasks if labour_tasks else []
        materials_breakdown = materials if materials else []
        # Compute costs from breakdowns if available
        if labour_breakdown:
            labour_cost = sum(task.hours * adjusted_labour_rate * task.workers for task in labour_breakdown)
        else:
            labour_cost = base_hours * adjusted_labour_rate
        if materials_breakdown:
            materials_cost = sum(get_material_cost(item.item, item.quantity) for item in materials_breakdown)
        else:
            materials_cost = estimated_materials
        total_labour_cost = labour_cost
        total_materials_cost = materials_cost
        internal_cost = (labour_cost + materials_cost) * risk_multiplier
        total_materials_cost = sum(item.total_cost for item in materials_breakdown) if materials_breakdown else materials_cost
        total_labour_cost = sum(task.hours * adjusted_labour_rate * task.workers for task in labour_breakdown) if labour_breakdown else labour_cost

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

        # Simulate Market Stats
        # Assume the market average is slightly higher than our balanced price (we are efficient)
        # but with a wide variance.
        # User request: Balanced pricing to be just right below market average by like 1%
        market_mean = balanced_price / 0.99  
        market_std_dev = market_mean * 0.12  # 12% standard deviation
        
        market_stats = MarketStats(
            mean=round(market_mean, 2),
            std_dev=round(market_std_dev, 2),
            lower_bound=round(market_mean - (3 * market_std_dev), 2),
            upper_bound=round(market_mean + (3 * market_std_dev), 2)
        )

        return PricingOutput(
            internal_cost_estimate=round(internal_cost, 2),
            price_bands=PricingBands(
                win_at_all_costs=round(win_price, 2),
                balanced=round(balanced_price, 2),
                premium=round(premium_price, 2)
            ),
            min_recommended_price=round(win_price, 2),
            market_stats=market_stats,
            materials_breakdown=materials_breakdown,
            labour_breakdown=labour_breakdown,
            total_materials_cost=round(total_materials_cost, 2),
            total_labour_cost=round(total_labour_cost, 2)
        )
