import logging
from datetime import datetime, timezone
from .base import BaseScraper

logger = logging.getLogger(__name__)


class IntigritiScraper(BaseScraper):
    platform = "intigriti"
    base_url = "https://app.intigriti.com/api/core/researcher/programs"

    async def fetch_programs(self) -> list[dict]:
        programs = []
        try:
            resp = await self.client.get(self.base_url)
            resp.raise_for_status()
            data = resp.json()

            records = data if isinstance(data, list) else data.get("records", data.get("data", []))

            for entry in records:
                try:
                    programs.append(self.normalize(entry))
                except Exception as e:
                    logger.warning(f"Intigriti normalize error: {e}")

        except Exception as e:
            logger.error(f"Intigriti fetch error: {e}")

        logger.info(f"Intigriti: fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict:
        handle = raw.get("handle", raw.get("companyHandle", ""))
        name = raw.get("name", handle)

        reward_min = None
        reward_max = None

        min_bounty = raw.get("minBounty") or raw.get("minimumBounty")
        max_bounty = raw.get("maxBounty") or raw.get("maximumBounty")
        if min_bounty is not None:
            reward_min = int(float(min_bounty))
        if max_bounty is not None:
            reward_max = int(float(max_bounty))

        # Scope
        assets = []
        asset_types = set()
        for domain in raw.get("domains", []) or raw.get("scope", []):
            if isinstance(domain, dict):
                endpoint = domain.get("endpoint", domain.get("name", ""))
                dtype = domain.get("type", {})
                if isinstance(dtype, dict):
                    dtype = dtype.get("value", "")
                if endpoint:
                    assets.append(str(endpoint))
                if dtype:
                    asset_types.add(str(dtype).lower())
            elif isinstance(domain, str):
                assets.append(domain)

        # Confidence score as response time proxy
        response_time = None
        confidence = raw.get("confidenceScore") or raw.get("confidence_score")
        if confidence is not None:
            response_time = f"Confidence: {confidence}/100"

        status = "open"
        raw_status = raw.get("status", {})
        if isinstance(raw_status, dict):
            raw_status = raw_status.get("value", "open")
        if str(raw_status).lower() not in ("open", "active", "1"):
            status = "paused"

        return {
            "id": self.make_id(handle or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://app.intigriti.com/researcher/programs/{handle}/detail"
            if handle else "https://www.intigriti.com/researchers/bug-bounty-programs",
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": self.format_reward_range(reward_min, reward_max),
            "assets": assets[:20],
            "asset_types": list(asset_types),
            "status": status,
            "response_time": response_time,
            "managed": raw.get("managed", False),
            "logo_url": raw.get("logoUrl") or raw.get("logo"),
            "description": (raw.get("description") or raw.get("tagline") or "")[:500],
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
