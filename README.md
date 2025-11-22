# Bid Sniper Backend

FastAPI backend for "The Bid Sniper – Tender Bender".

## Setup

1.  **Environment Variables**:
    Create a `.env` file in the root directory (or set them in your environment):
    ```bash
    OPENAI_API_KEY=sk-...
    VALYU_API_KEY=...
    VALYU_API_BASE_URL=https://api.valyu.ai
    LIVEKIT_API_KEY=...
    LIVEKIT_API_SECRET=...
    LIVEKIT_URL=wss://...
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run Server**:
    ```bash
    uvicorn app.main:app --reload
    ```

## API Usage

### Create Bid
```bash
curl -X POST http://localhost:8000/bids \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, Springfield",
    "region": "US-IL",
    "job_type": "roof_repair",
    "labour_rate": 85.0,
    "desired_margin_percent": 0.2
  }'
```

### Get LiveKit Token
```bash
curl -X POST http://localhost:8000/voice/token \
  -H "Content-Type: application/json" \
  -d '{
    "room_name": "bid-session-123",
    "identity": "contractor-01"
  }'
```

## Testing
Run tests with pytest:
```bash
pytest
```
