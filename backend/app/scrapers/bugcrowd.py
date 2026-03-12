import logging
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from .base import BaseScraper

logger = logging.getLogger(__name__)


class BugcrowdScraper(BaseScraper):
    platform = "bugcrowd"
    base_url = "https://bugcrowd.com/engagements.json"

    async def fetch_programs(self) -> list[dict]:
        programs = []
        page = 1

        while True:
            try:
                resp = await self.client.get(
                    self.base_url,
                    params={
                        "category": "bug_bounty",
                        "sort_by": "promoted",
                        "sort_direction": "desc",
                        "page": page,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                logger.error(f"Bugcrowd fetch error (page {page}): {e}")
                # Fallback to HTML scraping
                if page == 1:
                    return await self._fetch_html_fallback()
                break

            entries = data.get("engagements", [])
            if not entries:
                break

            for entry in entries:
                try:
                    programs.append(self.normalize(entry))
                except Exception as e:
                    logger.warning(f"Bugcrowd normalize error: {e}")

            if len(entries) < 25:
                break
            page += 1
            if page > 20:
                break

        logger.info(f"Bugcrowd: fetched {len(programs)} programs")
        return programs

    async def _fetch_html_fallback(self) -> list[dict]:
        """Fallback HTML scraper for Bugcrowd program listings."""
        programs = []
        try:
            resp = await self.client.get("https://bugcrowd.com/programs")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            for card in soup.select("[data-engagement]"):
                try:
                    name = card.select_one("h2, .engagement-title")
                    link = card.select_one("a[href]")
                    reward_el = card.select_one(".reward, .bounty-range")

                    if not name:
                        continue

                    slug = link["href"].strip("/") if link else name.text.strip().lower().replace(" ", "-")
                    reward_text = reward_el.text.strip() if reward_el else ""

                    programs.append({
                        "id": self.make_id(slug),
                        "name": name.text.strip(),
                        "platform": self.platform,
                        "platform_url": f"https://bugcrowd.com/{slug}",
                        "reward_min": None,
                        "reward_max": None,
                        "reward_range": reward_text or "Not specified",
                        "assets": [],
                        "asset_types": [],
                        "status": "open",
                        "response_time": None,
                        "managed": True,
                        "logo_url": None,
                        "description": None,
                        "last_updated": datetime.now(timezone.utc),
                        "fetched_at": datetime.now(timezone.utc),
                    })
                except Exception as e:
                    logger.warning(f"Bugcrowd HTML parse error: {e}")
        except Exception as e:
            logger.error(f"Bugcrowd HTML fallback error: {e}")

        logger.info(f"Bugcrowd (HTML fallback): fetched {len(programs)} programs")
        return programs

    def normalize(self, raw: dict) -> dict:
        slug = raw.get("briefUrl", raw.get("code", ""))
        name = raw.get("name", slug)

        reward_min = None
        reward_max = None
        reward_range_text = "Not specified"

        min_amount = raw.get("minRewardAmount") or raw.get("minimum_reward")
        max_amount = raw.get("maxRewardAmount") or raw.get("maximum_reward")
        if min_amount is not None:
            reward_min = int(float(min_amount))
        if max_amount is not None:
            reward_max = int(float(max_amount))

        reward_range_text = self.format_reward_range(reward_min, reward_max)

        # Target types
        asset_types = []
        targets = raw.get("targetGroups", []) or raw.get("targets", [])
        for tg in targets:
            if isinstance(tg, dict):
                t = tg.get("type", "").lower()
                if t:
                    asset_types.append(t)

        return {
            "id": self.make_id(slug or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://bugcrowd.com/{slug}" if slug else f"https://bugcrowd.com/programs",
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": reward_range_text,
            "assets": [],
            "asset_types": list(set(asset_types)),
            "status": "open" if raw.get("status", "open") in ("open", "active") else "paused",
            "response_time": None,
            "managed": True,
            "logo_url": raw.get("logoUrl") or raw.get("logo"),
            "description": (raw.get("tagline") or raw.get("description") or "")[:500],
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
