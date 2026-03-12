import logging
from datetime import datetime, timezone
from .base import BaseScraper

logger = logging.getLogger(__name__)

GITHUB_URL = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/main/data/yeswehack_data.json"


class YesWeHackScraper(BaseScraper):
    platform = "yeswehack"
    base_url = GITHUB_URL

    async def fetch_programs(self) -> list[dict]:
        programs = []
        try:
            resp = await self.client.get(self.base_url, timeout=30.0)
            resp.raise_for_status()
            data = resp.json()

            for entry in data:
                try:
                    normalized = self.normalize(entry)
                    if normalized:
                        programs.append(normalized)
                except Exception as e:
                    logger.warning(f"YesWeHack normalize error: {e}")

        except Exception as e:
            logger.error(f"YesWeHack fetch error: {e}")

        logger.info(f"YesWeHack: fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict | None:
        name = raw.get("name", "")
        prog_id = raw.get("id", "")
        if not name and not prog_id:
            return None

        # Filter: only public and enabled
        if not raw.get("public", True):
            return None
        if raw.get("disabled", False):
            return None

        reward_min = None
        reward_max = None
        min_bounty = raw.get("min_bounty")
        max_bounty = raw.get("max_bounty")
        if min_bounty is not None:
            try:
                reward_min = int(float(min_bounty))
            except (ValueError, TypeError):
                pass
        if max_bounty is not None:
            try:
                reward_max = int(float(max_bounty))
            except (ValueError, TypeError):
                pass

        # Scope
        assets = []
        asset_types = set()
        targets = raw.get("targets", {})
        for scope in targets.get("in_scope", []):
            target = scope.get("target", "")
            stype = scope.get("type", "")
            if target:
                assets.append(target)
            if stype:
                asset_types.add(stype.lower())

        managed = raw.get("managed")

        return {
            "id": self.make_id(prog_id or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://yeswehack.com/programs/{prog_id}"
            if prog_id else "https://yeswehack.com/programs",
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": self.format_reward_range(reward_min, reward_max),
            "assets": assets[:20],
            "asset_types": list(asset_types),
            "status": "open",
            "response_time": None,
            "managed": bool(managed),
            "logo_url": None,
            "description": None,
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
