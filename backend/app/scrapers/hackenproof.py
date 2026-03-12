import json
import logging
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from .base import BaseScraper

logger = logging.getLogger(__name__)


class HackenProofScraper(BaseScraper):
    platform = "hackenproof"
    base_url = "https://hackenproof.com/programs"

    async def fetch_programs(self) -> list[dict]:
        programs = []
        try:
            # Try JSON API first
            resp = await self.client.get(
                "https://hackenproof.com/api/programs",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                entries = data if isinstance(data, list) else data.get("data", data.get("programs", []))
                for entry in entries:
                    try:
                        programs.append(self.normalize(entry))
                    except Exception as e:
                        logger.warning(f"HackenProof normalize error: {e}")
                if programs:
                    logger.info(f"HackenProof: fetched {len(programs)} programs via API")
                    return programs

            # Fallback: scrape HTML
            programs = await self._fetch_html()

        except Exception as e:
            logger.error(f"HackenProof fetch error: {e}")
            programs = await self._fetch_html()

        logger.info(f"HackenProof: fetched {len(programs)} programs")
        return programs

    async def _fetch_html(self) -> list[dict]:
        programs = []
        try:
            resp = await self.client.get(self.base_url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Try to find embedded JSON data (common in SPAs)
            for script in soup.find_all("script"):
                text = script.string or ""
                if "programs" in text and "{" in text:
                    try:
                        # Try to extract JSON from script
                        start = text.find("[")
                        end = text.rfind("]") + 1
                        if start >= 0 and end > start:
                            data = json.loads(text[start:end])
                            for entry in data:
                                if isinstance(entry, dict) and entry.get("name"):
                                    programs.append(self.normalize(entry))
                            if programs:
                                return programs
                    except (json.JSONDecodeError, Exception):
                        continue

            # Parse HTML cards
            for card in soup.select(".program-card, .card, [class*='program']"):
                try:
                    name_el = card.select_one("h2, h3, .title, .program-name, [class*='name']")
                    link_el = card.select_one("a[href]")
                    reward_el = card.select_one("[class*='reward'], [class*='bounty']")

                    if not name_el:
                        continue

                    name = name_el.text.strip()
                    slug = ""
                    if link_el:
                        href = link_el.get("href", "")
                        slug = href.strip("/").split("/")[-1] if href else ""

                    programs.append({
                        "id": self.make_id(slug or name.lower().replace(" ", "-")),
                        "name": name,
                        "platform": self.platform,
                        "platform_url": f"https://hackenproof.com/{slug}" if slug else self.base_url,
                        "reward_min": None,
                        "reward_max": None,
                        "reward_range": reward_el.text.strip() if reward_el else "Not specified",
                        "assets": [],
                        "asset_types": [],
                        "status": "open",
                        "response_time": None,
                        "managed": False,
                        "logo_url": None,
                        "description": None,
                        "last_updated": datetime.now(timezone.utc),
                        "fetched_at": datetime.now(timezone.utc),
                    })
                except Exception as e:
                    logger.warning(f"HackenProof card parse error: {e}")

        except Exception as e:
            logger.error(f"HackenProof HTML fetch error: {e}")

        return programs

    def normalize(self, raw: dict) -> dict:
        slug = raw.get("slug", raw.get("id", ""))
        name = raw.get("name", raw.get("title", slug))

        reward_min = None
        reward_max = None
        for key in ("minReward", "min_reward", "minimum_reward", "reward_min"):
            val = raw.get(key)
            if val is not None:
                try:
                    reward_min = int(float(str(val).replace(",", "")))
                    break
                except (ValueError, TypeError):
                    pass
        for key in ("maxReward", "max_reward", "maximum_reward", "reward_max"):
            val = raw.get(key)
            if val is not None:
                try:
                    reward_max = int(float(str(val).replace(",", "")))
                    break
                except (ValueError, TypeError):
                    pass

        asset_types = []
        focus = raw.get("focus", raw.get("type", "")).lower()
        if focus:
            asset_types.append(focus)

        return {
            "id": self.make_id(slug or name.lower().replace(" ", "-")),
            "name": name,
            "platform": self.platform,
            "platform_url": f"https://hackenproof.com/{slug}" if slug else self.base_url,
            "reward_min": reward_min,
            "reward_max": reward_max,
            "reward_range": self.format_reward_range(reward_min, reward_max),
            "assets": [],
            "asset_types": asset_types,
            "status": "open" if raw.get("status", "active") in ("active", "open") else "paused",
            "response_time": None,
            "managed": False,
            "logo_url": raw.get("logo") or raw.get("logoUrl") or raw.get("image"),
            "description": (raw.get("description") or raw.get("brief") or "")[:500],
            "last_updated": datetime.now(timezone.utc),
            "fetched_at": datetime.now(timezone.utc),
        }
