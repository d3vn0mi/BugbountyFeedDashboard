import logging
from datetime import datetime, timezone
from .base import BaseScraper

logger = logging.getLogger(__name__)

GITHUB_URL = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/main/data/hackerone_data.json"


class HackerOneScraper(BaseScraper):
    platform = "hackerone"
    base_url = GITHUB_URL

    async def fetch_programs(self) -> list[dict]:
        programs = []
        try:
            resp = await self.client.get(self.base_url, timeout=60.0)
            resp.raise_for_status()
            data = resp.json()

            for entry in data:
                try:
                    normalized = self.normalize(entry)
                    if normalized:
                        programs.append(normalized)
                except Exception as e:
                    logger.warning(f"HackerOne normalize error: {e}")

        except Exception as e:
            logger.error(f"HackerOne fetch error: {e}")

        logger.info(f"HackerOne: fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict | None:
        name = raw.get("name", "")
        handle = raw.get("handle", "")
        if not name and not handle:
            return None

        # Filter to open programs only
        submission_state = raw.get("submission_state", "")
        if submission_state and submission_state != "open":
            return None

        offers_bounties = raw.get("offers_bounties", False)

        # Response efficiency
        response_time = None
        resp_eff = raw.get("response_efficiency_percentage")
        if resp_eff is not None:
            response_time = f"{resp_eff}% efficient"

        # Scope
        assets = []
        asset_types = set()
        targets = raw.get("targets", {})
        for scope in targets.get("in_scope", []):
            asset_id = scope.get("asset_identifier", "")
            asset_type = scope.get("asset_type", "")
            if asset_id:
                assets.append(asset_id)
            if asset_type:
                asset_types.add(asset_type.lower())

        reward_min = 0 if offers_bounties else None
        reward_max = None

        return {
            "id": self.make_id(handle or name.lower().replace(" ", "-")),
            "name": name or handle,
            "platform": self.platform,
            "platform_url": raw.get("url", f"https://hackerone.com/{handle}"),
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": "Bounty" if offers_bounties else "VDP",
            "assets": assets[:20],
            "asset_types": list(asset_types),
            "status": "open",
            "response_time": response_time,
            "managed": raw.get("managed_program", False),
            "logo_url": None,
            "description": None,
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
