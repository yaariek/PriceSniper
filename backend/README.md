# PriceSniper - Backend

FastAPI backend for The Bid Sniper application.

## Setup

1. Install dependencies:
```bash
cd backend
pip3 install -r requirements.txt
```

2. Configure environment variables:
```bash
cp ../.env backend/.env
```

Edit `.env` and set:
- `OPENAI_API_KEY` - Your OpenAI API key
- `VALYU_API_KEY` - Your Valyu API key
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` - LiveKit credentials (optional)

3. Run the server:
```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /health` - Health check
- `POST /bids` - Create a new bid
- `GET /bids/{bid_id}` - Get bid details
- `POST /voice/token` - Get LiveKit voice token

## Cache Configuration

Labour rate cache TTL: **24 hours**
