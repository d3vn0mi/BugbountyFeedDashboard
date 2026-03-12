<p align="center">
  <code><strong>d3vn0mi</strong></code><code>@sec</code>
</p>

<h1 align="center">Bug Bounty Feed Dashboard</h1>

<p align="center">
  Aggregated bug bounty programs from 5 platforms in a single searchable dashboard.
  <br />
  Built for security researchers who hunt across multiple platforms.
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#api">API</a> &middot;
  <a href="#deployment">Deployment</a> &middot;
  <a href="ROADMAP.md">Roadmap</a>
</p>

---

## Platforms

| Platform | Source | Focus |
|----------|--------|-------|
| **HackerOne** | GitHub mirror (arkadiyt/bounty-targets-data) | General bug bounty |
| **Bugcrowd** | Engagements API + HTML fallback | General bug bounty |
| **Intigriti** | GitHub mirror | European programs |
| **Immunefi** | GitHub mirror | Web3 / DeFi / Smart contracts |
| **YesWeHack** | GitHub mirror | European programs |

## Features

- **Search** programs by name, description, or scope/assets
- **Filter** by platform, reward range, asset type, status
- **Sort** by name, reward, platform, or date
- **Favorites** — bookmark programs (persisted in browser)
- **CSV export** — download filtered results
- **Detail modal** — full scope, metadata, and direct links
- **Dark mode** — with system preference detection
- **Shareable URLs** — filters sync to query params
- **Mobile-friendly** — collapsible filters, responsive cards
- **Stats dashboard** — total programs, per-platform counts, highest bounty
- **Auto-refresh** — data updates every hour in the background

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 / FastAPI / SQLAlchemy / SQLite |
| Frontend | React 19 / TypeScript / Vite / Tailwind CSS 4 |
| Deployment | Docker Compose / Caddy (auto-SSL) / Nginx |

## Quick Start

### Docker (recommended)

```bash
docker compose up -d
```

Dashboard at **http://localhost:3000**. Programs are fetched automatically on startup.

```bash
docker compose logs -f backend    # Watch scraper activity
docker compose down               # Stop
```

### Local Development

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python run.py                     # http://localhost:8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173 (proxies /api to backend)
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/programs` | GET | List programs (search, filter, sort, paginate) |
| `/api/programs/{id}` | GET | Single program detail |
| `/api/programs/export` | GET | CSV export with same filters |
| `/api/platforms` | GET | Platform list with counts |
| `/api/stats` | GET | Dashboard stats (totals, highest bounty) |
| `/api/refresh` | POST | Manual refresh (requires `ADMIN_TOKEN`) |

### Query Parameters (`/api/programs`)

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search name/description |
| `platform` | string | Comma-separated: `hackerone,bugcrowd` |
| `min_reward` | int | Minimum bounty (USD) |
| `max_reward` | int | Maximum bounty (USD) |
| `asset_type` | string | `web`, `api`, `smart_contract`, etc. |
| `status` | string | `open` or `paused` |
| `scope_search` | string | Search within asset/scope names |
| `sort_by` | string | `name`, `reward_max`, `platform`, `status` |
| `sort_order` | string | `asc` or `desc` |
| `page` | int | Page number (default: 1) |
| `per_page` | int | Results per page (1-100, default: 25) |

## Deployment

### Production (with SSL)

For deploying to a domain like `bughunting.d3vn0mi.com`:

1. **DNS**: Add an A record pointing to your server IP (Cloudflare: DNS only mode)

2. **Deploy**:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. Caddy auto-provisions Let's Encrypt SSL. Site is live at `https://your-domain.com`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./bugbounty.db` | Database connection string |
| `CACHE_TTL_SECONDS` | `3600` | Data cache lifetime |
| `REFRESH_INTERVAL_SECONDS` | `3600` | Auto-refresh interval |
| `ALLOWED_ORIGINS` | `*` | CORS origins (comma-separated) |
| `RATE_LIMIT_RPM` | `60` | API rate limit per IP per minute |
| `ADMIN_TOKEN` | _(empty)_ | Bearer token for `/api/refresh` |

### Security

- Rate limiting (60 req/min per IP)
- CORS lockdown in production
- Content-Security-Policy, HSTS, X-Frame-Options via Caddy
- Non-root Docker containers
- Input validation on all query parameters
- URL scheme validation (prevents open redirects)
- Admin-only manual refresh endpoint

## Project Structure

```
BugbountyFeedDashboard/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, middleware, lifecycle
│   │   ├── config.py          # Environment configuration
│   │   ├── database.py        # SQLAlchemy async engine
│   │   ├── models.py          # Program model
│   │   ├── schemas.py         # Pydantic response schemas
│   │   ├── routers/
│   │   │   └── programs.py    # API endpoints
│   │   └── scrapers/
│   │       ├── base.py        # Abstract scraper
│   │       ├── hackerone.py
│   │       ├── bugcrowd.py
│   │       ├── intigriti.py
│   │       ├── immunefi.py
│   │       └── yeswehack.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/Dashboard.tsx
│   │   ├── components/        # Header, Cards, Filters, Modal, etc.
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Security utilities
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml         # Development
├── docker-compose.prod.yml    # Production (adds Caddy SSL)
├── Caddyfile                  # Reverse proxy + security headers
├── ROADMAP.md                 # Future improvements
└── LICENSE                    # MIT
```

## License

[MIT](LICENSE) - Copyright (c) 2026 d3vn0mi
