import httpx
from typing import List, Dict, Any
from app.config import settings

class ValyuClient:
    def __init__(self):
        self.base_url = settings.VALYU_API_BASE_URL
        self.api_key = settings.VALYU_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def search_property_and_neighbourhood(self, address: str, region: str, job_type: str) -> List[Dict[str, Any]]:
        # In a real scenario, this would call the API.
        # For now, we'll simulate a response or try to call if URL is real.
        # If the base URL is a placeholder, we return mock data.
        
        if "api.valyu.ai" in self.base_url and "sk-" not in self.api_key: # simplistic check for real vs mock
             return self._get_mock_data(address)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/search",
                    headers=self.headers,
                    json={
                        "query": f"{address}, {region} for {job_type}",
                        "sources": ["property", "permits", "materials", "neighbourhood"]
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
        except Exception as e:
            print(f"Valyu API call failed: {e}. Returning mock data.")
            return self._get_mock_data(address)

    def _get_mock_data(self, address: str) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Property History",
                "snippet": f"Built in 1985. Last sold in 2018 for $450,000. {address}",
                "raw_metadata": {"year_built": 1985, "last_sale_price": 450000, "last_sale_date": "2018-05-15"}
            },
            {
                "title": "Neighbourhood Stats",
                "snippet": "Median home price in this area is $480k. Prices are trending up 5% YoY.",
                "raw_metadata": {"median_price": 480000, "trend": "up"}
            },
            {
                "title": "Permit History",
                "snippet": "Roof replacement permit issued in 2005. HVAC upgrade in 2015.",
                "raw_metadata": {"permits": [{"type": "roof", "year": 2005}, {"type": "hvac", "year": 2015}]}
            }
        ]
