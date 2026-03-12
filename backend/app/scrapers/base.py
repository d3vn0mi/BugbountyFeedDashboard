from abc import ABC, abstractmethod
import httpx
import logging

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    platform: str = ""
    base_url: str = ""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "BugBountyFeed/1.0 (Security Research Dashboard)"
            },
        )

    async def close(self):
        await self.client.aclose()

    @abstractmethod
    async def fetch_programs(self) -> list[dict]:
        """Fetch and return normalized program dicts."""
        pass

    def normalize(self, raw: dict) -> dict:
        """Override to normalize platform-specific data into standard format."""
        return raw

    def make_id(self, slug: str) -> str:
        return f"{self.platform}:{slug}"

    def format_reward_range(self, min_val: int | None, max_val: int | None) -> str:
        if min_val is not None and max_val is not None:
            return f"${min_val:,} - ${max_val:,}"
        if max_val is not None:
            return f"Up to ${max_val:,}"
        if min_val is not None:
            return f"From ${min_val:,}"
        return "Not specified"
