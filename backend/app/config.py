import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bugbounty.db")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour
REFRESH_INTERVAL_SECONDS = int(os.getenv("REFRESH_INTERVAL_SECONDS", "3600"))
