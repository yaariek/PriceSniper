from datetime import datetime, timedelta
from typing import Optional, Dict

class LabourRateCache:
    """Simple in-memory cache for labour rates by region and job type"""
    
    def __init__(self, ttl_hours: int = 24):
        self._cache: Dict[str, Dict] = {}
        self.ttl = timedelta(hours=ttl_hours)
    
    def _make_key(self, region: str, job_type: str) -> str:
        """Create cache key from region and job type"""
        return f"{region.lower()}:{job_type.lower()}"
    
    def get(self, region: str, job_type: str) -> Optional[float]:
        """Get cached labour rate if available and not expired"""
        key = self._make_key(region, job_type)
        
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if datetime.now() - entry["timestamp"] > self.ttl:
            # Expired, remove from cache
            del self._cache[key]
            return None
        
        return entry["labour_rate"]
    
    def set(self, region: str, job_type: str, labour_rate: float):
        """Cache a labour rate for a region and job type"""
        key = self._make_key(region, job_type)
        self._cache[key] = {
            "labour_rate": labour_rate,
            "timestamp": datetime.now()
        }
    
    def clear(self):
        """Clear all cached entries"""
        self._cache.clear()

# Global cache instance
labour_rate_cache = LabourRateCache()
