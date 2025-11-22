# PriceSniper - The Bid Sniper

AI-powered bid generation system for contractors.

## Project Structure

```
PriceSniper/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   ├── requirements.txt
│   └── README.md
├── frontend/         # Static frontend
│   ├── static/       # HTML/CSS/JS files
│   └── README.md
└── .env             # Environment variables
```

## Quick Start

### Backend Setup

```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend

The frontend is automatically served by the backend at `http://localhost:8000`

## Configuration

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_key
VALYU_API_KEY=your_valyu_key
VALYU_API_BASE_URL=https://api.valyu.ai
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-livekit-url
```

## Features

- **AI-Driven Pricing**: Uses OpenAI to estimate job costs based on property context
- **Real-Time Data**: Integrates with Valyu API for property and market data
- **Smart Caching**: Labour rates cached for 24 hours by region
- **Multiple Search Strategies**: Property details, labour rates, and market rates
- **LLM-Based Extraction**: Intelligently extracts structured data from web search results

## Cache Configuration

- **Labour Rate Cache TTL**: 24 hours
- **Cache Key Format**: `{region}:{job_type}`
