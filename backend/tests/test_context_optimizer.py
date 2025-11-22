import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.context_optimizer import ContextOptimizer
from app.models.schemas import PropertyContext

@pytest.mark.asyncio
async def test_context_optimizer_llm_extraction():
    # Mock OpenAI client
    mock_client = AsyncMock()
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='''
        {
            "property_year_built": 1930,
            "year_built_confidence": "estimated",
            "architectural_period": "Inter-war",
            "property_type": "semi_detached",
            "property_size_sqm": 120.5,
            "number_of_bedrooms": 3,
            "number_of_floors": 2,
            "last_sale_price": 450000,
            "last_sale_date": "2020-05-15",
            "estimated_value": 550000,
            "neighbourhood_price_median": 500000,
            "neighbourhood_price_trend": "up",
            "material_cost_band": "medium",
            "labour_rate_band": "medium",
            "likely_risk_flags": ["Asbestos risk due to age"]
        }
        '''))
    ]
    mock_client.chat.completions.create.return_value = mock_response

    with patch("app.services.context_optimizer.AsyncOpenAI", return_value=mock_client):
        optimizer = ContextOptimizer()
        # Force client to be our mock if __init__ didn't set it (e.g. no API key in env)
        optimizer.client = mock_client
        
        raw_results = [{"title": "Test Result", "snippet": "Built in 1930s semi-detached home."}]
        job_info = {"job_type": "roof_repair", "address": "123 Test St"}
        
        context = await optimizer.optimize(raw_results, job_info)
        
        assert isinstance(context, PropertyContext)
        assert context.property_year_built == 1930
        assert context.property_type == "semi_detached"
        assert context.number_of_bedrooms == 3
        assert "Asbestos risk due to age" in context.likely_risk_flags
