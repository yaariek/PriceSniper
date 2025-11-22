# Frontend Integration

## Overview
The frontend has been replaced with the **house-insight-pro** React application.

## Technology Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI components)
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **State Management:** TanStack Query
- **PWA:** Vite PWA Plugin

## Setup

### Development Mode
```bash
cd frontend
npm install
npm run dev
```
The dev server will run on `http://localhost:5173`

### Production Build
```bash
cd frontend
npm run build
```
The build output will be in `frontend/dist/`

## Backend Integration

The FastAPI backend automatically serves the built React app:
- Frontend build is served from `/`
- API endpoints are at `/bids` and `/voice`
- Health check at `/health`

### Configuration
Create `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Running the Full Stack

1. **Start Backend:**
```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

2. **Build Frontend (one-time):**
```bash
cd frontend
npm install
npm run build
```

3. **Access Application:**
- Frontend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Features
- Modern, responsive UI with shadcn/ui components
- Progressive Web App (PWA) support
- Dark mode support
- TypeScript for type safety
- Optimized production builds

## Development Workflow

For frontend development with hot reload:
```bash
# Terminal 1: Backend
cd backend && python3 -m uvicorn app.main:app --reload

# Terminal 2: Frontend dev server
cd frontend && npm run dev
```

Then access:
- Frontend dev: `http://localhost:5173` (with hot reload)
- Backend API: `http://localhost:8000`
