import pytest
from app.services.pricing_engine import PricingEngine
from app.models.schemas import PropertyContext, PricingBands

def test_pricing_engine_logic():
    engine = PricingEngine()
    
    # Mock context
    context = PropertyContext(
        material_cost_band="medium",
        labour_rate_band="medium",
        likely_risk_flags=[]
    )
    
    # Test Case 1: Simple roof repair
    output = engine.calculate_pricing(
        context=context,
        job_type="roof_repair",
        labour_rate=50.0,
        desired_margin=0.2
    )
    
    # Base: 16h * 50 + 500 = 1300
    assert output.internal_cost_estimate == 1300.0
    # Balanced: 1300 / (1 - 0.2) = 1625
    assert output.price_bands.balanced == 1625.0

def test_pricing_engine_risk_factor():
    engine = PricingEngine()
    context = PropertyContext(
        material_cost_band="medium",
        labour_rate_band="medium",
        likely_risk_flags=["Old wiring/plumbing risk"]
    )
    
    output = engine.calculate_pricing(
        context=context,
        job_type="roof_repair",
        labour_rate=50.0,
        desired_margin=0.2
    )
    
    # Base: 1300 * 1.15 = 1495
    assert output.internal_cost_estimate == 1495.0
