import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete

from app.config import REFRESH_INTERVAL_SECONDS, ALLOWED_ORIGINS, RATE_LIMIT_RPM, ADMIN_TOKEN
from app.database import engine, async_session
from app.models import Base, Program
from app.routers.programs import router as programs_router
from app.scrapers.hackerone import HackerOneScraper
from app.scrapers.bugcrowd import BugcrowdScraper
from app.scrapers.intigriti import IntigritiScraper
from app.scrapers.immunefi import ImmunefiScraper
from app.scrapers.yeswehack import YesWeHackScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALL_SCRAPERS = [
    HackerOneScraper,
    BugcrowdScraper,
    IntigritiScraper,
    ImmunefiScraper,
    YesWeHackScraper,
]


# In-memory rate limiter with bounded storage (per-IP, sliding window)
_rate_buckets: dict[str, list[float]] = {}
_MAX_TRACKED_IPS = 10000


def check_rate_limit(client_ip: str) -> bool:
    """Return True if request is allowed, False if rate-limited."""
    now = time.monotonic()
    window = 60.0

    # Evict stale IPs if we exceed the cap
    if len(_rate_buckets) > _MAX_TRACKED_IPS:
        stale = [ip for ip, ts in _rate_buckets.items() if not ts or now - ts[-1] > window]
        for ip in stale:
            del _rate_buckets[ip]

    bucket = _rate_buckets.get(client_ip, [])
    bucket = [t for t in bucket if now - t < window]

    if len(bucket) >= RATE_LIMIT_RPM:
        _rate_buckets[client_ip] = bucket
        return False

    bucket.append(now)
    _rate_buckets[client_ip] = bucket
    return True


async def refresh_programs():
    """Fetch programs from all platforms and store in DB."""
    logger.info("Starting program refresh from all platforms...")
    all_programs = []

    scrapers = [cls() for cls in ALL_SCRAPERS]
    try:
        results = await asyncio.gather(
            *[s.fetch_programs() for s in scrapers],
            return_exceptions=True,
        )
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Scraper {scrapers[i].platform} failed: {result}")
            else:
                all_programs.extend(result)
    finally:
        for s in scrapers:
            await s.close()

    if not all_programs:
        logger.warning("No programs fetched from any platform")
        return

    # Upsert all programs
    async with async_session() as session:
        async with session.begin():
            # Clear old data and insert fresh
            await session.execute(delete(Program))
            for prog_data in all_programs:
                program = Program(**prog_data)
                session.add(program)

        await session.commit()

    logger.info(f"Refresh complete: {len(all_programs)} programs stored")


async def periodic_refresh(stop_event: asyncio.Event):
    """Background task to refresh data periodically."""
    while not stop_event.is_set():
        try:
            await refresh_programs()
        except Exception as e:
            logger.error(f"Periodic refresh error: {e}")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=REFRESH_INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initial data fetch (non-blocking: server starts even if scrapers fail)
    try:
        await refresh_programs()
    except Exception as e:
        logger.error(f"Initial refresh failed (will retry later): {e}")

    # Start periodic refresh
    stop_event = asyncio.Event()
    refresh_task = asyncio.create_task(periodic_refresh(stop_event))

    yield

    # Cleanup
    stop_event.set()
    refresh_task.cancel()
    try:
        await refresh_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()


app = FastAPI(
    title="d3vn0mi Bug Bounty Feed",
    description="Aggregated bug bounty programs from multiple platforms",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,      # disable Swagger UI in production
    redoc_url=None,      # disable ReDoc in production
    openapi_url=None,    # disable OpenAPI schema in production
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
            headers={"Retry-After": "60"},
        )
    return await call_next(request)


app.include_router(programs_router)


@app.post("/api/refresh")
async def trigger_refresh(authorization: str = Header(None)):
    """Manually trigger a data refresh. Requires ADMIN_TOKEN."""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Refresh endpoint disabled (no ADMIN_TOKEN configured)")
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid or missing authorization token")
    await refresh_programs()
    return {"status": "ok", "refreshed_at": datetime.now(timezone.utc).isoformat()}
