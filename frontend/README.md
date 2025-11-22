# PriceSniper - Frontend

Static HTML/CSS/JS frontend for The Bid Sniper application.

## Setup

The frontend is a simple static site. You can:

1. **Serve via backend**: The FastAPI backend automatically serves the frontend at `http://localhost:8000`

2. **Serve independently**: Use any static file server:
```bash
cd frontend/static
python3 -m http.server 8080
```

Then update the API endpoint in `index.html` to point to your backend URL.

## Structure

- `static/index.html` - Main application interface
- Includes embedded CSS and JavaScript
- Connects to backend API at `/bids` endpoint
