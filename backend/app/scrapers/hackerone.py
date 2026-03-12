import logging
from datetime import datetime, timezone
from .base import BaseScraper

logger = logging.getLogger(__name__)


class HackerOneScraper(BaseScraper):
    platform = "hackerone"
    base_url = "https://api.hackerone.com/v1/hackers/programs"

    async def fetch_programs(self) -> list[dict]:
        programs = []
        page = 1
        per_page = 100

        while True:
            try:
                resp = await self.client.get(
                    self.base_url,
                    params={"page[size]": per_page, "page[number]": page},
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                logger.error(f"HackerOne fetch error (page {page}): {e}")
                break

            entries = data.get("data", [])
            if not entries:
                break

            for entry in entries:
                try:
                    programs.append(self.normalize(entry))
                except Exception as e:
                    logger.warning(f"HackerOne normalize error: {e}")

            # Check for next page
            links = data.get("links", {})
            if not links.get("next"):
                break
            page += 1
            if page > 20:  # Safety cap
                break

        logger.info(f"HackerOne: fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict:
        attrs = raw.get("attributes", {})
        handle = attrs.get("handle", "")
        name = attrs.get("name", handle)

        # Extract bounty table info
        reward_min = None
        reward_max = None
        if attrs.get("meta", {}).get("bounty_table"):
            for row in attrs["meta"]["bounty_table"]:
                low = row.get("low")
                high = row.get("high")
                if low is not None:
                    if reward_min is None or low < reward_min:
                        reward_min = int(low)
                if high is not None:
                    if reward_max is None or high > reward_max:
                        reward_max = int(high)

        # Try simpler reward extraction from offers_bounties
        if reward_max is None and attrs.get("offers_bounties"):
            reward_min = reward_min or 0

        # Response efficiency
        response_time = None
        resp_eff = attrs.get("response_efficiency_percentage")
        if resp_eff is not None:
            response_time = f"{resp_eff}% efficient"

        # Scope / structured_scopes
        assets = []
        asset_types = set()
        for scope in attrs.get("structured_scopes", {}).get("data", []):
            scope_attrs = scope.get("attributes", {})
            asset_id = scope_attrs.get("asset_identifier", "")
            asset_type = scope_attrs.get("asset_type", "")
            if asset_id:
                assets.append(asset_id)
            if asset_type:
                asset_types.add(asset_type.lower())

        return {
            "id": self.make_id(handle),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://hackerone.com/{handle}",
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": self.format_reward_range(reward_min, reward_max),
            "assets": assets[:20],
            "asset_types": list(asset_types),
            "status": "open" if attrs.get("submission_state") == "open" else "paused",
            "response_time": response_time,
            "managed": attrs.get("triage_active", False),
            "logo_url": attrs.get("profile_picture"),
            "description": (attrs.get("policy", "") or "")[:500],
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
