"""
api/routes/ai.py — Endpoints for AI itinerary generation and route optimization.
"""

import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.itinerary import ItineraryItem
from app.models.place import Place
from app.models.trip import Trip
from app.models.user import User
from app.schemas.ai import PlanRequest
from app.schemas.trip import TripWithItinerary, TripRead
from app.services.ai import generate_itinerary
from app.services.geocoding import search_nominatim
from app.services.route_optimizer import optimize_day_route

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/plan", response_model=TripWithItinerary, status_code=status.HTTP_201_CREATED)
async def create_ai_plan(
    body: PlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripWithItinerary:
    """
    1. Calls Ollama to generate an itinerary.
    2. Geocodes the places via Nominatim.
    3. Saves Places, Trip, and ItineraryItems to the database.
    """
    try:
        # 1. Generate Structured Itinerary
        plan = await generate_itinerary(body.destination, body.days, body.theme)
    except Exception as e:
        logger.error(f"AI Plan Generation Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail=str(e)
        )

    # 2. Create the Trip in DB
    trip = Trip(
        user_id=current_user.id,
        title=f"{plan.title} ({body.destination})",
        share_token=str(uuid.uuid4())
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    # 3. Process the days, geocode places, and add items
    for day in plan.itinerary:
        for idx, activity in enumerate(day.activities):
            search_query = f"{activity.name}, {body.destination}"
            results = await search_nominatim(search_query, limit=1)
            
            # If no result is found, try falling back to just the name, or skip it.
            # In a real app we might ask the user, but here we just take best effort.
            if not results:
                results = await search_nominatim(activity.name, limit=1)

            if results:
                top_result = results[0]
                
                # Check if this place is already saved by this user
                place_res = await db.execute(
                    select(Place).where(
                        Place.lat == top_result["lat"], 
                        Place.lon == top_result["lon"], 
                        Place.user_id == current_user.id
                    )
                )
                place = place_res.scalar_one_or_none()
                
                if not place:
                    place = Place(
                        user_id=current_user.id,
                        name=activity.name,
                        display_name=top_result["display_name"],
                        lat=top_result["lat"],
                        lon=top_result["lon"],
                        category=activity.category or top_result["category"]
                    )
                    db.add(place)
                    await db.commit()
                    await db.refresh(place)

                item = ItineraryItem(
                    trip_id=trip.id,
                    place_id=place.id,
                    day_number=day.day,
                    order=idx
                )
                db.add(item)
    
    await db.commit()
    
    # Fetch final trip to return
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.items).joinedload(ItineraryItem.place))
        .where(Trip.id == trip.id)
    )
    final_trip = result.scalar_one()
    return TripWithItinerary.model_validate(final_trip)


@router.post("/optimize/{trip_id}", status_code=status.HTTP_200_OK)
async def optimize_trip_route(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Optimizes the ordering of ItineraryItems for each day using Nearest Neighbor + 2-opt.
    """
    # Fetch trip and verify ownership/permissions
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.items).joinedload(ItineraryItem.place))
        .where(Trip.id == trip_id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    # Quick authorization check: only owner for now (could extend to editors)
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to optimize this trip.")

    # Group items by day
    items_by_day = {}
    for item in trip.items:
        items_by_day.setdefault(item.day_number, []).append(item)

    total_updated = 0
    
    # Optimize each day
    for day, items in items_by_day.items():
        if len(items) <= 2:
            continue
            
        # Format for optimizer
        places_data = [{"id": item.id, "lat": item.place.lat, "lon": item.place.lon} for item in items]
        optimized = optimize_day_route(places_data)
        
        # Update orders in DB memory
        for new_order, opt_data in enumerate(optimized):
            # Find the corresponding item and update its order
            original_item = next(i for i in items if i.id == opt_data["id"])
            original_item.order = new_order
            total_updated += 1

    await db.commit()
    return {"status": "success", "message": f"Optimized {total_updated} items across {len(items_by_day)} days."}
