# PriceSniper

AI bid co-pilot for UK contractors. PriceSniper combines Valyu search, LLMs, and a pricing engine to turn a raw job description into a ready-to-send proposal, pricing bands, and market position in seconds.

## Highlights
- Parallel Valyu searches for property details, market comps, and labour rates with 24h caching
- Context optimizer + OpenAI to build property dossiers and location-specific explanations
- Pricing engine with win/balanced/premium bands, risk buffers, and market curve visualization
- Voice dictation via LiveKit token handshake plus Web Speech API fallback
- React/Vite frontend (shadcn/ui) served by FastAPI after `npm run build`

## Stack
- Backend: FastAPI, Valyu SDK, OpenAI, LiveKit token helper, async pipeline
- Frontend: React 18 + TypeScript + Vite, shadcn/ui, Recharts, TanStack Query

## Project Structure
```
PriceSniper/
├── backend/          # FastAPI app, pipeline, services
│   ├── app/          # Routers, pipeline, services, schemas
│   ├── requirements.txt
│   └── README.md
├── frontend/         # React/Vite UI
│   ├── src/          # Pages, components, api client
│   └── vite.config.ts
└── README.md         # You are here
```

## Prerequisites
- Python 3.10+ and `pip`
- Node 18+ and `npm`
- API keys: OpenAI + Valyu (LiveKit optional but required for voice token)

## Setup

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
```

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-...
VALYU_API_KEY=...
VALYU_API_BASE_URL=https://api.valyu.ai
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://<your-livekit-host>
```

Run the API:
```bash
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs   Health: /health
```

### Frontend
```bash
cd frontend
npm install
```

For local dev (hot reload):
```bash
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev    # http://localhost:5173
```

For production build served by FastAPI:
```bash
npm run build          # outputs to frontend/dist
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Frontend available at /, API at /bids, /voice, /health
```

## API Overview
- `POST /bids` — run full bid pipeline (Valyu search → LLM context → pricing bands → proposal + follow-ups)
- `GET /bids/{bid_id}` — fetch generated bid from in-memory store
- `POST /voice/token` — LiveKit access token for voice dictation/agent
- `GET /health` — service heartbeat

## Notes
- Labour rates are cached per region/address for 24 hours.
- If OpenAI key is missing, text outputs return mock strings; Valyu requires a valid key to run searches.
