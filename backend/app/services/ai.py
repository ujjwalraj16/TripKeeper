"""
services/ai.py — Handles interactions with the local Ollama LLM.
"""

import json
import logging
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.ai import AIPlanResult

logger = logging.getLogger(__name__)


async def generate_itinerary(destination: str, days: int, theme: str, max_retries: int = 3) -> AIPlanResult:
    """
    Calls Ollama to generate a structured itinerary.
    Retries on JSON decoding or Pydantic validation errors.
    """
    prompt = (
        f"You are an expert travel planner. Create a {days}-day itinerary for a trip to {destination}. "
        f"The theme of the trip is: {theme}. "
        "Return ONLY a JSON object that strictly adheres to the following schema structure. "
        "Do NOT wrap the JSON in markdown blocks like ```json ... ```. Output raw JSON only.\n\n"
        f"Schema structure required:\n"
        "{\n"
        '  "title": "A catchy title for the trip",\n'
        '  "itinerary": [\n'
        '    {\n'
        '      "day": 1,\n'
        '      "activities": [\n'
        '        { "name": "Exact Name of Place (e.g. Eiffel Tower)", "category": "landmark" },\n'
        '        { "name": "Restaurant Name", "category": "restaurant" }\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        "}\n"
    )

    url = f"{settings.ollama_host.rstrip('/')}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json" # Tells Ollama to enforce JSON output (works on most modern models)
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                data = response.json()
                response_text = data.get("response", "")
                
                # Parse and validate with Pydantic
                parsed_json = json.loads(response_text)
                result = AIPlanResult.model_validate(parsed_json)
                return result

            except httpx.RequestError as e:
                logger.error(f"Error communicating with Ollama: {e}")
                raise RuntimeError("Failed to connect to Ollama. Ensure the Ollama service is running.")
            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"Ollama output validation failed on attempt {attempt}: {e}")
                if attempt == max_retries:
                    raise RuntimeError("Failed to generate a valid itinerary after multiple attempts.")
                # We can refine the prompt for the retry if we want, but usually it just needs another shot.
                
    raise RuntimeError("Unexpected error during itinerary generation.")
