# Bug Bounty Feed Dashboard

A unified dashboard that aggregates bug bounty programs from multiple platforms, giving security researchers a single place to browse, search, and filter programs.

## Platforms

- **HackerOne** - via public API
- **Bugcrowd** - via engagements API with HTML fallback
- **Intigriti** - via researcher API
- **Immunefi** - web3/DeFi programs
- **HackenProof** - via API with HTML fallback

## Tech Stack

- **Backend**: Python / FastAPI / SQLAlchemy / SQLite
- **Frontend**: React / TypeScript / Vite / Tailwind CSS

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` with API proxy to backend.

## Features

- Search programs by name or description
- Filter by platform, reward range, asset type, status
- Sort by name, reward, or platform
- Paginated results
- Auto-refreshes data every hour
- Direct links to program pages on each platform

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/programs` | List programs with search/filter/sort/pagination |
| `GET /api/programs/{id}` | Get single program details |
| `GET /api/platforms` | List platforms with program counts |
| `GET /api/stats` | Dashboard summary statistics |
| `POST /api/refresh` | Trigger manual data refresh |
