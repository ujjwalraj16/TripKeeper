import asyncio
import json
from urllib.parse import urlencode

NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "TripKeeper/0.1 (portfolio project; contact: tripkeeper@example.com)"

async def search_nominatim(query: str, limit: int = 8):
    qs = urlencode({"q": query, "format": "json", "limit": str(limit)})
    url = f"{NOMINATIM_BASE}?{qs}"
    print(f"Requesting: {url}")
    try:
        proc = await asyncio.create_subprocess_exec(
            "curl", "-s", "--max-time", "10",
            "-A", USER_AGENT,
            "-H", "Accept-Language: en",
            url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        raw = json.loads(stdout.decode())
        print("PARSED:", raw)
    except Exception as e:
        print("EXCEPTION:", e)

asyncio.run(search_nominatim("Tokyo Tower"))
