"""
services/geocoding.py — Nominatim (OpenStreetMap) search wrapper.

Proxied server-side to:
  1. Add a proper User-Agent header (required by Nominatim ToS).
  2. Keep API calls off the client (avoid CORS issues).

Note: Nominatim's Cloudflare/WAF blocks Python's httpx HTTP/2 fingerprint
      on some networks.  We use asyncio subprocess curl as a workaround;
      it's equivalent and reliable without introducing extra dependencies.
"""

import asyncio
import json
from urllib.parse import urlencode

NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "TripKeeper/0.1 (portfolio project; contact: tripkeeper@example.com)"


async def search_nominatim(query: str, limit: int = 8) -> list[dict]:
    """
    Forward a free-text query to Nominatim and return normalised results.
    Returns an empty list on network error or no results.
    Uses an async subprocess curl call to avoid TLS fingerprint blocks.
    """
    qs = urlencode({"q": query, "format": "json", "limit": str(limit)})
    url = f"{NOMINATIM_BASE}?{qs}"

    try:
        proc = await asyncio.create_subprocess_exec(
            "curl", "-s", "--max-time", "10",
            "-A", USER_AGENT,
            "-H", "Accept-Language: en",
            url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await proc.communicate()
        raw: list[dict] = json.loads(stdout.decode())
    except Exception:
        return []

    results = []
    for item in raw:
        results.append(
            {
                "place_id": item.get("place_id", 0),
                "display_name": item.get("display_name", ""),
                "lat": float(item.get("lat", 0)),
                "lon": float(item.get("lon", 0)),
                "category": item.get("class"),   # Nominatim uses "class" not "category"
                "type": item.get("type"),
            }
        )
    return results
