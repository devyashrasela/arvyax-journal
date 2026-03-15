# AI-Assisted Journal System

An AI-powered journal system for ArvyaX that lets users write journal entries after immersive nature sessions (forest, ocean, mountain), analyze emotions using Google Gemini, and view aggregated mental wellness insights.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express |
| **Database** | MySQL (Aiven) |
| **LLM** | Google Gemini 2.0 Flash |
| **Frontend** | React 19 + Vite 6 |
| **Deployment** | Vercel (both frontend & backend) |

## Project Structure

```
├── backend/              # Express API server
│   ├── api/index.js      # Main entry (Vercel serverless)
│   ├── src/
│   │   ├── db.js         # MySQL connection + init
│   │   ├── routes/journal.js  # All API endpoints
│   │   ├── services/llm.js    # Gemini integration
│   │   ├── services/cache.js  # LRU analysis cache
│   │   └── middleware/rateLimiter.js
│   ├── certs/ca.pem      # Aiven SSL cert (not in git)
│   ├── vercel.json
│   └── .env.example
├── frontend/             # React SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js        # API client
│   │   ├── index.css     # Full design system
│   │   └── components/   # Sidebar, Header, JournalForm, etc.
│   ├── vercel.json
│   └── .env.example
├── README.md
└── ARCHITECTURE.md
```

## Setup & Run

### Prerequisites
- Node.js 18+
- MySQL database (Aiven free tier recommended)
- Google Gemini API key ([Get free key](https://aistudio.google.com))

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials:
#   DATABASE_URL=mysql://user:pass@host:port/dbname
#   GEMINI_API_KEY=your_key
#   FRONTEND_URL=http://localhost:5173

# Place your Aiven ca.pem in backend/certs/ca.pem

npm install
npm run db:init    # Create tables
npm run dev        # Starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:3001

npm install
npm run dev        # Starts on http://localhost:5173
```

## API Endpoints

### `POST /api/journal` — Create Journal Entry
```json
// Request
{
  "userId": "123",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain."
}

// Response (201)
{
  "message": "Journal entry created successfully",
  "entry": { "id": 1, "user_id": "123", "ambience": "forest", "text": "...", "created_at": "..." }
}
```

### `GET /api/journal/:userId` — Get All Entries
```json
// Response
{
  "entries": [
    { "id": 1, "user_id": "123", "ambience": "forest", "text": "...", "emotion": "calm", "keywords": [...], "summary": "...", "created_at": "..." }
  ]
}
```

### `POST /api/journal/analyze` — Analyze Emotions (LLM)
```json
// Request
{ "text": "I felt calm today after listening to the rain" }

// Response
{
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session"
}
```

### `GET /api/journal/insights/:userId` — Get Insights
```json
// Response
{
  "totalEntries": 8,
  "topEmotion": "calm",
  "mostUsedAmbience": "forest",
  "recentKeywords": ["focus", "nature", "rain"]
}
```

### `GET /api/health` — Health Check
```json
{ "status": "ok", "timestamp": "2026-03-15T08:00:00.000Z" }
```

## Deployment (Vercel)

Both `frontend/` and `backend/` are separate Vercel projects:

1. **Backend**: Import `backend/` folder. Add env vars (`DATABASE_URL`, `GEMINI_API_KEY`, `FRONTEND_URL`) in Vercel dashboard.
2. **Frontend**: Import `frontend/` folder. Add env var `VITE_API_URL=<your-backend-vercel-url>` in Vercel dashboard.

## Bonus Features

- **Analysis caching** — SHA-256 hash-based LRU cache prevents duplicate LLM calls
- **Rate limiting** — 100 req/15min general, 20 req/15min for analysis
- **Vercel-ready** — Both frontend and backend configured for Vercel serverless deployment
