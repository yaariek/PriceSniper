from typing import List, Dict, Any, Optional
import re
from app.config import settings
from app.services.labour_rate_cache import labour_rate_cache
from app.utils.retry import with_retry

class ValyuClient:
    def __init__(self):
        self.api_key = settings.VALYU_API_KEY
        self.valyu_client = None
        
        # Only initialize if we have a real API key
        if self.api_key and not self.api_key.startswith("placeholder"):
            try:
                from valyu import Valyu
                self.valyu_client = Valyu(api_key=self.api_key)
            except ImportError:
                raise RuntimeError("Valyu package not installed. Run: pip install valyu")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize Valyu client: {e}")
        else:
            raise RuntimeError("Valid Valyu API key required. Please set VALYU_API_KEY in .env")

    @with_retry(max_retries=3, initial_delay=1.0)
    async def search_property_details(self, address: str, region: str) -> List[Dict[str, Any]]:
        """Search for comprehensive property information including type, year, size"""
        # Enhanced query with multiple property attributes
        query = f"""{address}, {region} 
property type detached terraced flat house bungalow semi_detached 
year built construction date when built age 
square meters sqm sqm2 size size_sqft 
number of bedrooms bedrooms rooms 
property history building permits sales price value zoning 
architectural style Victorian Edwardian Georgian modern new build"""
        
        print(f"DEBUG: Executing Valyu search with query: {query}")

        try:
            response = self.valyu_client.search(query, search_type="web")
            results = self._transform_results(response.results)
            print(f"Property search returned {len(results)} results for: {address}")
            return results
        except Exception as e:
            print(f"Property search failed: {e}")
            return []

    @with_retry(max_retries=3, initial_delay=1.0)
    async def search_labour_rates(self, region: str, job_type: str, address: str = None) -> Optional[float]:
        """Search for labour rates in the region for the job type, with caching"""
        
        # Check cache first
        cache_key = f"{address or region}"
        cached_rate = labour_rate_cache.get(cache_key, job_type)
        if cached_rate is not None:
            print(f"Using cached labour rate for {cache_key}, {job_type}: £{cached_rate}/hr")
            return cached_rate
        
        # Search Valyu for labour rates
        # Use address if available for more local rates
        location_query = address if address else region
        query = f"hourly labour rate for {job_type} in {location_query} cost per hour tradesperson price"
        
        try:
            response = self.valyu_client.search(query, search_type="web")
            results = self._transform_results(response.results)
            
            # Extract labour rate from results
            labour_rate = self._extract_labour_rate(results)
            
            if labour_rate:
                # Cache the result
                labour_rate_cache.set(cache_key, job_type, labour_rate)
                print(f"Detected labour rate for {location_query}, {job_type}: £{labour_rate}/hr")
                return labour_rate
            
            print(f"Could not detect labour rate from search results for {location_query}")
            return None
            
        except Exception as e:
            print(f"Labour rate search failed: {e}")
            return None

    @with_retry(max_retries=3, initial_delay=1.0)
    async def search_market_rates(self, region: str, job_type: str) -> List[Dict[str, Any]]:
        """Search for average market rates and costs for the job type in the region"""
        query = f"{region} {job_type} average cost price market rate"
        
        try:
            response = self.valyu_client.search(query, search_type="web")
            results = self._transform_results(response.results)
            print(f"Market rate search returned {len(results)} results for: {query}")
            return results
        except Exception as e:
            print(f"Market rate search failed: {e}")
            return []

    def _transform_results(self, results) -> List[Dict[str, Any]]:
        """Transform Valyu results to our format"""
        transformed = []
        for result in results:
            transformed.append({
                "title": result.title,
                "snippet": result.content[:300] if result.content else "",
                "url": result.url,
                "raw_metadata": {
                    "full_content": result.content,
                    "url": result.url
                }
            })
        return transformed

    def _extract_labour_rate(self, results: List[Dict[str, Any]]) -> Optional[float]:
        """Extract labour rate from search results using pattern matching"""
        
        # Patterns to match: "£50/hr", "£50 per hour", "£50-£60/hr", etc.
        patterns = [
            r'£(\d+(?:\.\d+)?)\s*(?:per hour|/hr|/hour|an hour|ph)',
            r'£(\d+(?:\.\d+)?)\s*-\s*£(\d+(?:\.\d+)?)\s*(?:per hour|/hr|/hour|ph)',
            r'(\d+(?:\.\d+)?)\s*(?:pounds|GBP)\s*(?:per hour|/hr|/hour|ph)',
            r'hourly rate.*?£(\d+(?:\.\d+)?)',
            r'labour cost.*?£(\d+(?:\.\d+)?)',
        ]
        
        rates = []
        
        for result in results:
            content = result.get("snippet", "") + " " + result.get("raw_metadata", {}).get("full_content", "")
            
            for pattern in patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        # Range match, take average
                        try:
                            low = float(match[0])
                            high = float(match[1])
                            rates.append((low + high) / 2)
                        except:
                            pass
                    else:
                        # Single value
                        try:
                            rates.append(float(match))
                        except:
                            pass
        
        if rates:
            # Filter out unrealistic rates (e.g. < £15 or > £200)
            valid_rates = [r for r in rates if 15 <= r <= 200]
            if valid_rates:
                # Return median of found rates
                valid_rates.sort()
                median_idx = len(valid_rates) // 2
                return valid_rates[median_idx]
        
        return None

