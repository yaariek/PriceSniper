from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    VALYU_API_KEY: str
    VALYU_API_BASE_URL: str = "https://api.valyu.ai"
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str
    LIVEKIT_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
