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

app.include_router(bids.router, prefix="/bids", tags=["bids"])
app.include_router(voice.router, prefix="/voice", tags=["voice"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve React build files (after running npm run build)
frontend_build_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")

# Mount static assets
if os.path.exists(frontend_build_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build_path, "assets")), name="assets")
    
    @app.get("/")
    async def root():
        return FileResponse(os.path.join(frontend_build_path, "index.html"))
    
    # Catch-all route for React Router (SPA)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't intercept API routes
        if full_path.startswith(("bids", "voice", "health")):
            return {"error": "Not found"}
        return FileResponse(os.path.join(frontend_build_path, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "Frontend not built. Run 'cd frontend && npm install && npm run build'"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
