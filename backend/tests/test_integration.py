import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch

client = TestClient(app)

def test_create_bid_flow():
    # Mock external calls to avoid real API hits
    with patch("app.services.valyu_client.ValyuClient.search_property_and_neighbourhood") as mock_valyu, \
         patch("app.services.llm_client.LLMClient._generate") as mock_llm:
        
        mock_valyu.return_value = []
        mock_llm.return_value = "Mocked LLM content"
        
        payload = {
            "address": "123 Test St",
            "region": "UK-LDN",
            "job_type": "roof_repair",
            "labour_rate": 60.0,
            "desired_margin_percent": 0.25
        }
        
        response = client.post("/bids", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "bid_id" in data
        assert data["pricing"]["internal_cost_estimate"] > 0
        assert data["dossier_text"] == "Mocked LLM content"

def test_get_bid_404():
    response = client.get("/bids/non-existent-id")
    assert response.status_code == 404
