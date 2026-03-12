import json
import logging
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from .base import BaseScraper

logger = logging.getLogger(__name__)


class ImmunefiScraper(BaseScraper):
    platform = "immunefi"
    base_url = "https://immunefi.com/bug-bounty/"

    async def fetch_programs(self) -> list[dict]:
        programs = []
        try:
            # Immunefi embeds program data as JSON in their Next.js page
            resp = await self.client.get(self.base_url)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            # Try to find Next.js data script
            for script in soup.find_all("script", {"id": "__NEXT_DATA__"}):
                try:
                    data = json.loads(script.string)
                    bounties = (
                        data.get("props", {})
                        .get("pageProps", {})
                        .get("bounties", [])
                    )
                    for entry in bounties:
                        try:
                            programs.append(self.normalize(entry))
                        except Exception as e:
                            logger.warning(f"Immunefi normalize error: {e}")
                    if programs:
                        break
                except json.JSONDecodeError:
                    continue

            # Fallback: try JSON API endpoint
            if not programs:
                programs = await self._fetch_api()

        except Exception as e:
            logger.error(f"Immunefi fetch error: {e}")

        logger.info(f"Immunefi: fetched {len(programs)} programs")
        return programs

    async def _fetch_api(self) -> list[dict]:
        """Try Immunefi's API endpoints."""
        programs = []
        try:
            # Try the v2 bounties endpoint
            resp = await self.client.get(
                "https://immunefi.com/api/bounty",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                entries = data if isinstance(data, list) else data.get("data", data.get("bounties", []))
                for entry in entries:
                    try:
                        programs.append(self.normalize(entry))
                    except Exception as e:
                        logger.warning(f"Immunefi API normalize error: {e}")
        except Exception as e:
            logger.warning(f"Immunefi API fallback error: {e}")
        return programs

    def normalize(self, raw: dict) -> dict:
        slug = raw.get("id", raw.get("slug", ""))
        name = raw.get("project", raw.get("name", slug))

        reward_max = None
        max_reward = raw.get("maxBounty") or raw.get("maximum_reward") or raw.get("maxReward")
        if max_reward is not None:
            try:
                reward_max = int(float(str(max_reward).replace(",", "")))
            except (ValueError, TypeError):
                pass

        reward_min = None
        min_reward = raw.get("minBounty") or raw.get("minimum_reward")
        if min_reward is not None:
            try:
                reward_min = int(float(str(min_reward).replace(",", "")))
            except (ValueError, TypeError):
                pass

        # Assets
        assets = []
        asset_types = set()
        for asset in raw.get("assets", []):
            if isinstance(asset, dict):
                target = asset.get("target", asset.get("url", ""))
                atype = asset.get("type", "")
                if target:
                    assets.append(str(target))
                if atype:
                    asset_types.add(str(atype).lower())

        # Infer asset types from category
        category = raw.get("category", "").lower()
        if "smart" in category or "contract" in category:
            asset_types.add("smart_contract")
        if "web" in category:
            asset_types.add("web")

        launch_date = raw.get("launchDate") or raw.get("date")
        total_paid = raw.get("totalPaidAmount")
        description = raw.get("description") or ""
        if total_paid:
            description = f"Total paid: ${total_paid:,}. {description}" if isinstance(total_paid, (int, float)) else description

        return {
            "id": self.make_id(slug or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://immunefi.com/bug-bounty/{slug}/information/"
            if slug else "https://immunefi.com/bug-bounty/",
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": self.format_reward_range(reward_min, reward_max),
            "assets": assets[:20],
            "asset_types": list(asset_types) or ["web3"],
            "status": "open",
            "response_time": None,
            "managed": False,
            "logo_url": raw.get("logo") or raw.get("logoUrl"),
            "description": (description or "")[:500],
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
