import logging
from datetime import datetime, timezone
from .base import BaseScraper

logger = logging.getLogger(__name__)

GITHUB_URL = "https://raw.githubusercontent.com/infosec-us-team/Immunefi-Bug-Bounty-Programs-Unofficial/main/projects.json"


class ImmunefiScraper(BaseScraper):
    platform = "immunefi"
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
                    logger.warning(f"Immunefi normalize error: {e}")

        except Exception as e:
            logger.error(f"Immunefi fetch error: {e}")

        logger.info(f"Immunefi: fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict | None:
        name = raw.get("project", "")
        slug = raw.get("slug", "")
        if not name and not slug:
            return None

        reward_max = None
        max_bounty = raw.get("maxBounty")
        if max_bounty is not None:
            try:
                reward_max = int(float(str(max_bounty).replace(",", "")))
            except (ValueError, TypeError):
                pass

        # Assets from the summary
        assets = []
        asset_types = set()
        for asset in raw.get("assets", []):
            if isinstance(asset, dict):
                target = asset.get("url", asset.get("target", ""))
                atype = asset.get("type", "")
                if target:
                    assets.append(str(target))
                if atype:
                    asset_types.add(str(atype).lower())

        # Infer types from programType
        for pt in raw.get("programType", []):
            pt_lower = pt.lower()
            if "smart contract" in pt_lower:
                asset_types.add("smart_contract")
            elif "web" in pt_lower:
                asset_types.add("web")
            elif "blockchain" in pt_lower:
                asset_types.add("blockchain")

        if not asset_types:
            asset_types.add("web3")

        rewards_token = raw.get("rewardsToken", "USD")
        reward_range = self.format_reward_range(None, reward_max)
        if rewards_token and rewards_token != "USD" and reward_max:
            reward_range = f"Up to ${reward_max:,} {rewards_token}"

        ecosystem = raw.get("ecosystem", [])
        description = ", ".join(ecosystem) if ecosystem else None

        return {
            "id": self.make_id(slug or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://immunefi.com/bug-bounty/{slug}/information/"
            if slug else "https://immunefi.com/bug-bounty/",
            "reward_min": None,
            "reward_max": reward_max,
            "reward_range": reward_range,
            "assets": assets[:20],
            "asset_types": list(asset_types),
            "status": "open",
            "response_time": None,
            "managed": False,
            "logo_url": None,
            "description": description,
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
