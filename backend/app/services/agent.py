"""
services/agent.py — Tool-calling AI Agent using Ollama.
"""

import json
import logging
from typing import List, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.itinerary import ItineraryItem
from app.models.place import Place
from app.models.trip import Trip
from app.services.geocoding import search_nominatim
from app.services.route_optimizer import optimize_day_route

logger = logging.getLogger(__name__)

# ── Tool Definitions for Ollama ────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_place_to_trip",
            "description": "Adds a new place to a specific day in the trip itinerary.",
            "parameters": {
                "type": "object",
                "properties": {
                    "place_name": {"type": "string", "description": "The exact name of the place to add (e.g. Eiffel Tower)"},
                    "day_number": {"type": "integer", "description": "The day number to add the place to (e.g. 1)"}
                },
                "required": ["place_name", "day_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "remove_place",
            "description": "Removes a place from the trip itinerary by its itinerary item ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_id": {"type": "integer", "description": "The ID of the itinerary item to remove."}
                },
                "required": ["item_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "optimize_route",
            "description": "Optimizes the routing and order of places for the trip using nearest-neighbor.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Fetches the current weather forecast for a location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number", "description": "Latitude of the location"},
                    "lon": {"type": "number", "description": "Longitude of the location"}
                },
                "required": ["lat", "lon"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "estimate_budget",
            "description": "Estimates the total budget for the trip based on the number of places and days.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_places",
            "description": "Searches for a place using a query string to find its latitude and longitude.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query (e.g., 'Louvre Museum, Paris')"}
                },
                "required": ["query"]
            }
        }
    }
]


# ── Tool Implementations ───────────────────────────────────────────────────────

async def execute_tool(db: AsyncSession, trip: Trip, tool_name: str, args: Dict[str, Any]) -> str:
    """Executes a tool and returns the result as a string."""
    try:
        if tool_name == "search_places":
            results = await search_nominatim(args["query"], limit=3)
            return json.dumps(results)

        elif tool_name == "get_weather":
            # Using Open-Meteo free API
            lat = args["lat"]
            lon = args["lon"]
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return json.dumps(resp.json().get("current_weather", {}))
            return "Weather unavailable."

        elif tool_name == "estimate_budget":
            num_days = trip.end_date - trip.start_date if trip.start_date and trip.end_date else None
            days = num_days.days + 1 if num_days else max([i.day_number for i in trip.items] + [1])
            num_places = len(trip.items)
            # Basic mock calculation
            est = (days * 150) + (num_places * 20)
            return f"Estimated budget: ${est} USD (based on {days} days and {num_places} places)."

        elif tool_name == "optimize_route":
            items_by_day = {}
            for item in trip.items:
                items_by_day.setdefault(item.day_number, []).append(item)
            
            for day, items in items_by_day.items():
                if len(items) <= 2: continue
                places_data = [{"id": item.id, "lat": item.place.lat, "lon": item.place.lon} for item in items]
                optimized = optimize_day_route(places_data)
                for new_order, opt_data in enumerate(optimized):
                    original_item = next(i for i in items if i.id == opt_data["id"])
                    original_item.order = new_order
            await db.commit()
            return "Route optimized successfully."

        elif tool_name == "remove_place":
            item_id = int(args["item_id"])
            item = await db.get(ItineraryItem, item_id)
            if item and item.trip_id == trip.id:
                await db.delete(item)
                await db.commit()
                return f"Removed itinerary item {item_id}."
            return "Item not found in this trip."

        elif tool_name == "add_place_to_trip":
            place_name = args["place_name"]
            day = int(args["day_number"])
            
            # 1. Search for it
            results = await search_nominatim(place_name, limit=1)
            if not results:
                return f"Could not find place: {place_name}"
            
            top_result = results[0]
            
            # 2. Check if place exists
            place_res = await db.execute(
                select(Place).where(
                    Place.lat == top_result["lat"], 
                    Place.lon == top_result["lon"], 
                    Place.user_id == trip.user_id
                )
            )
            place = place_res.scalar_one_or_none()
            if not place:
                place = Place(
                    user_id=trip.user_id,
                    name=place_name,
                    display_name=top_result["display_name"],
                    lat=top_result["lat"],
                    lon=top_result["lon"],
                    category=top_result["category"]
                )
                db.add(place)
                await db.commit()
                await db.refresh(place)
                
            # 3. Add to trip
            order = len([i for i in trip.items if i.day_number == day])
            item = ItineraryItem(
                trip_id=trip.id,
                place_id=place.id,
                day_number=day,
                order=order
            )
            db.add(item)
            await db.commit()
            return f"Added {place_name} to Day {day}."

        else:
            return f"Unknown tool: {tool_name}"

    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        return f"Error executing {tool_name}: {str(e)}"


# ── Agent Loop ─────────────────────────────────────────────────────────────────

async def run_agent_loop(
    db: AsyncSession, 
    trip: Trip, 
    user_message: str, 
    chat_history: List[Dict[str, str]]
) -> str:
    """
    Runs the agent loop with Ollama.
    Max 5 iterations to prevent infinite loops.
    """
    messages = [{"role": "system", "content": "You are a helpful travel assistant. You can manage a user's trip itinerary using the provided tools."}]
    messages.extend(chat_history[-5:]) # keep last 5 context
    messages.append({"role": "user", "content": f"Trip Context: ID={trip.id}, Title='{trip.title}'.\nCurrent Itinerary: {[f'Day {i.day_number}: {i.place.name} (Item ID: {i.id})' for i in trip.items]}\n\nUser Request: {user_message}"})

    url = f"{settings.ollama_host.rstrip('/')}/api/chat"

    async with httpx.AsyncClient(timeout=120.0) as client:
        for iteration in range(5):
            payload = {
                "model": settings.ollama_model,
                "messages": messages,
                "tools": TOOLS,
                "stream": False
            }

            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                msg = data.get("message", {})

                if not msg.get("tool_calls"):
                    # Agent answered without tools
                    return msg.get("content", "I'm not sure how to respond to that.")

                # Process Tool Calls
                messages.append(msg) # Append the assistant's tool call message
                
                for tool_call in msg["tool_calls"]:
                    func = tool_call["function"]
                    t_name = func["name"]
                    t_args = func["arguments"]
                    
                    logger.info(f"Agent called tool: {t_name} with args {t_args}")
                    
                    # Execute
                    result_str = await execute_tool(db, trip, t_name, t_args)
                    
                    # Provide result back to agent
                    messages.append({
                        "role": "tool",
                        "content": result_str,
                        "name": t_name
                    })
                    
            except Exception as e:
                logger.error(f"Agent Loop Error: {e}")
                return "I encountered an error while trying to process your request."

    return "I reached my maximum thinking steps and had to stop."
