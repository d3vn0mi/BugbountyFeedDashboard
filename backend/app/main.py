import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete

from app.config import REFRESH_INTERVAL_SECONDS
from app.database import engine, async_session
from app.models import Base, Program
from app.routers.programs import router as programs_router
from app.scrapers.hackerone import HackerOneScraper
from app.scrapers.bugcrowd import BugcrowdScraper
from app.scrapers.intigriti import IntigritiScraper
from app.scrapers.immunefi import ImmunefiScraper
from app.scrapers.hackenproof import HackenProofScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALL_SCRAPERS = [
    HackerOneScraper,
    BugcrowdScraper,
    IntigritiScraper,
    ImmunefiScraper,
    HackenProofScraper,
]


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
    title="Bug Bounty Feed Dashboard",
    description="Aggregated bug bounty programs from multiple platforms",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(programs_router)


@app.post("/api/refresh")
async def trigger_refresh():
    """Manually trigger a data refresh."""
    await refresh_programs()
    return {"status": "ok", "refreshed_at": datetime.now(timezone.utc).isoformat()}
