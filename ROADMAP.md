# d3vn0mi Bug Bounty Feed Dashboard — Roadmap

## Current State (v1.0)

Fully functional dashboard aggregating bug bounty programs from 5 platforms
(HackerOne, Bugcrowd, Intigriti, Immunefi, YesWeHack) with search, filters,
favorites, CSV export, dark mode, detail modals, and production deployment
via Docker + Caddy with SSL.

---

## Phase 1: Data Quality & Reliability

### 1.1 Scraper Resilience
- [ ] Add retry logic with exponential backoff to all scrapers
- [ ] Add per-scraper timeout configuration (some sources are slow)
- [ ] Log scraper success/failure metrics (programs fetched, duration, errors)
- [ ] Add health check endpoint (`GET /api/health`) reporting scraper status and last successful fetch per platform

### 1.2 Data Freshness
- [ ] Track `last_successful_scrape` per platform in DB (not just global `fetched_at`)
- [ ] Show per-platform freshness indicators in the UI (green/yellow/red based on staleness)
- [ ] Add webhook/callback support for scrape completion notifications

### 1.3 Data Deduplication
- [ ] Detect and merge duplicate programs across platforms (e.g., same company on HackerOne + Bugcrowd)
- [ ] Add `canonical_name` field for cross-platform matching
- [ ] Show "Also on: [platform badges]" in program cards

### 1.4 More Platforms
- [ ] Add **Synack** (if public data becomes available)
- [ ] Add **Open Bug Bounty** (openbb list)
- [ ] Add **GitHub Security Advisories** (for OSS bounty programs)
- [ ] Add **Cobalt** scraper
- [ ] Design a plugin system for community-contributed scrapers

---

## Phase 2: User Experience

### 2.1 Notifications & Alerts
- [ ] Email/webhook alerts for new programs matching saved filters
- [ ] Browser push notifications for new high-bounty programs
- [ ] "Watch" a program — get notified when scope or rewards change
- [ ] Daily/weekly digest email of new programs

### 2.2 Enhanced Search
- [ ] Full-text search with ranking/relevance scoring
- [ ] Search suggestions / autocomplete for program names
- [ ] Saved searches — name and persist filter combinations
- [ ] Search history (recent searches in dropdown)

### 2.3 Program Comparison
- [ ] Side-by-side comparison of 2-3 programs (scope, rewards, response time)
- [ ] "Similar programs" recommendations based on scope/asset overlap
- [ ] Program change history — track when rewards or scope change over time

### 2.4 Views & Layout
- [ ] Table view toggle (dense list alternative to cards)
- [ ] Kanban-style board grouped by platform or status
- [ ] Map view for programs with geographic scope
- [ ] Keyboard navigation (j/k to move between cards, Enter to open modal)

### 2.5 Dashboard Widgets
- [ ] "New this week" carousel/section at the top
- [ ] Trending programs (most viewed/favorited)
- [ ] Reward distribution chart (histogram of bounty ranges)
- [ ] Platform breakdown pie chart
- [ ] Asset type distribution chart

---

## Phase 3: User Accounts & Personalization

### 3.1 Authentication
- [ ] Add user registration/login (OAuth with GitHub, Google)
- [ ] JWT-based API authentication
- [ ] Protected routes for user-specific features
- [ ] Rate limiting per authenticated user (higher limits for logged-in users)

### 3.2 User Profiles
- [ ] Persistent favorites synced across devices (DB-backed, not localStorage)
- [ ] Custom dashboard layouts (reorderable widgets)
- [ ] Saved filter presets with custom names
- [ ] Personal notes on programs (private annotations)

### 3.3 Collections & Tags
- [ ] User-created collections (e.g., "Web3 targets", "Easy wins")
- [ ] Custom tagging system for programs
- [ ] Share collections via public link
- [ ] Import/export collections as JSON

---

## Phase 4: Analytics & Insights

### 4.1 Program Analytics
- [ ] Reward trend graphs over time (are bounties increasing?)
- [ ] New programs added per week/month timeline
- [ ] Platform growth comparison charts
- [ ] Average/median bounty by platform, asset type, or industry

### 4.2 Scope Intelligence
- [ ] ASN and IP range lookups for scope domains
- [ ] Technology stack detection for in-scope targets (Wappalyzer-style)
- [ ] Subdomain enumeration preview for wildcard scopes
- [ ] Link to Shodan/Censys for scope assets

### 4.3 Community Stats
- [ ] Aggregate public disclosure stats (resolved reports, avg response time)
- [ ] Platform comparison dashboard (which platform pays fastest, most, etc.)
- [ ] "Value score" — composite metric of reward vs. competition vs. scope size

---

## Phase 5: Infrastructure & Scalability

### 5.1 Database Migration
- [ ] Migrate from SQLite to PostgreSQL for concurrent writes and production scale
- [ ] Add database migrations with Alembic
- [ ] Add connection pooling (asyncpg)
- [ ] Add read replicas for heavy query loads

### 5.2 Caching Layer
- [ ] Add Redis for API response caching (reduce DB queries)
- [ ] Cache scraper results between refreshes
- [ ] Implement ETag/Last-Modified headers for browser caching
- [ ] CDN for static frontend assets (Cloudflare cache rules)

### 5.3 Background Jobs
- [ ] Replace in-process scraper loop with a proper task queue (Celery/ARQ/Dramatiq)
- [ ] Stagger scraper runs to avoid thundering herd
- [ ] Add job dashboard for monitoring scraper runs
- [ ] Support manual per-platform refresh (not all-or-nothing)

### 5.4 Observability
- [ ] Structured JSON logging (replace print-style logs)
- [ ] Add Prometheus metrics endpoint (`/metrics`)
- [ ] Grafana dashboard for scraper health, API latency, error rates
- [ ] Error tracking with Sentry integration
- [ ] Uptime monitoring with alerting

### 5.5 CI/CD
- [ ] GitHub Actions pipeline: lint, type-check, test, build, deploy
- [ ] Automated Docker image builds on push
- [ ] Staging environment for pre-production testing
- [ ] Blue-green or rolling deployments
- [ ] Dependabot for dependency updates

---

## Phase 6: Security Enhancements

### 6.1 Input & Output Hardening
- [ ] Validate `logo_url` scheme (same `isSafeUrl` check as `platform_url`)
- [ ] Add Pydantic validation models for scraper response data
- [ ] Sanitize program descriptions before storage (strip HTML/scripts from scraped data)
- [ ] Add request ID tracking for audit logging

### 6.2 Authentication & Authorization
- [ ] API key management for programmatic access
- [ ] Role-based access control (admin vs. user)
- [ ] Audit log for admin actions (refresh triggers, config changes)
- [ ] Session management with secure cookie settings

### 6.3 Infrastructure Security
- [ ] Pin Docker base image digests (not just tags)
- [ ] Add container image scanning (Trivy/Grype) to CI
- [ ] Network policies — isolate backend from direct internet access
- [ ] Secrets management (HashiCorp Vault or Docker secrets instead of env vars)
- [ ] Automated dependency vulnerability scanning (pip-audit, npm audit)

### 6.4 Rate Limiting & Abuse Prevention
- [ ] Move rate limiter to Redis (shared across instances, persistent)
- [ ] Per-endpoint rate limits (stricter on `/export`, `/refresh`)
- [ ] CAPTCHA or proof-of-work for expensive operations
- [ ] IP reputation scoring (block known bad actors)

---

## Phase 7: API & Integrations

### 7.1 Public API
- [ ] Versioned API (`/api/v1/programs`)
- [ ] API documentation portal (re-enable OpenAPI with auth gate)
- [ ] API rate limiting tiers (free: 100/hr, authenticated: 1000/hr)
- [ ] Webhook subscriptions for program changes

### 7.2 Integrations
- [ ] Slack bot — query programs, get alerts in channels
- [ ] Discord bot integration
- [ ] Telegram bot for program alerts
- [ ] Browser extension — highlight in-scope domains while browsing
- [ ] CLI tool for terminal-based querying

### 7.3 Data Export
- [ ] JSON export (in addition to CSV)
- [ ] RSS/Atom feed for new programs
- [ ] Calendar feed (.ics) for program deadlines/events
- [ ] API for bulk data access (researchers, academics)

---

## Phase 8: Community & Content

### 8.1 Blog Integration
- [ ] Link to d3vn0mi blog posts related to specific platforms/programs
- [ ] "Tips & tricks" section per program (community-contributed)
- [ ] Writeup links — connect public disclosures to programs

### 8.2 Community Features
- [ ] Program reviews/ratings by hunters
- [ ] Difficulty rating (beginner/intermediate/advanced)
- [ ] "Success stories" — link to public bounty payouts
- [ ] Discussion threads per program

---

## Quick Wins (Low Effort, High Impact)

These can be done independently at any time:

- [ ] Add `logo_url` validation with `isSafeUrl()`
- [ ] Add a favicon (d3vn0mi branded)
- [ ] Add Open Graph meta tags for link previews
- [ ] Add a footer with version number and d3vn0mi.com link
- [ ] Add "Copy program URL" button in the modal
- [ ] Add "Back to top" button on long pages
- [ ] Add total reward stats to the CSV export filename (e.g., `programs-2026-03-12.csv`)
- [ ] Add loading indicator on the export button while downloading
- [ ] Add keyboard shortcut `Escape` to clear search
- [ ] Add `robots.txt` and `sitemap.xml` for SEO
