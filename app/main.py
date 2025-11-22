from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import bids, voice
from app.config import settings

app = FastAPI(
    title="The Bid Sniper – Tender Bender",
    description="Backend for automated construction bidding pipeline.",
    version="0.1.0"
)

# CORS - Allow all for hackathon/Lovable
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bids.router)
app.include_router(voice.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
