"""
api/routes/trips.py — Trip & Itinerary CRUD endpoints.

Routes:
  GET    /trips                → list all trips for current user
  POST   /trips                → create a new trip
  GET    /trips/{id}           → get a trip and its full itinerary
  PUT    /trips/{id}           → update a trip's details
  DELETE /trips/{id}           → delete a trip
  
  POST   /trips/{id}/items             → add a place to the itinerary
  DELETE /trips/{id}/items/{item_id}   → remove a place from the itinerary
  PATCH  /trips/{id}/items/reorder     → reorder places in the itinerary
"""

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
from app.schemas.trip import (
    ItineraryItemCreate,
    ItineraryItemRead,
    ReorderRequest,
    TripCreate,
    TripRead,
    TripUpdate,
    TripWithItinerary,
)

router = APIRouter()


# ── Trip CRUD ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list[TripRead])
async def list_trips(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TripRead]:
    """Return all trips for the current user."""
    result = await db.execute(
        select(Trip)
        .where(Trip.user_id == current_user.id)
        .order_by(Trip.start_date.desc().nulls_last(), Trip.created_at.desc())
    )
    trips = result.scalars().all()
    return [TripRead.model_validate(t) for t in trips]


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    body: TripCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripRead:
    """Create a new trip for the current user."""
    trip = Trip(
        user_id=current_user.id,
        title=body.title,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return TripRead.model_validate(trip)


@router.get("/{trip_id}", response_model=TripWithItinerary)
async def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripWithItinerary:
    """Return a single trip with its full itinerary."""
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.items).joinedload(ItineraryItem.place))
        .where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    return TripWithItinerary.model_validate(trip)


@router.put("/{trip_id}", response_model=TripRead)
async def update_trip(
    trip_id: int,
    body: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripRead:
    """Update a trip's details."""
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    if body.title is not None:
        trip.title = body.title
    if body.start_date is not NotImplemented: # Can be null
        trip.start_date = body.start_date
    if body.end_date is not NotImplemented:   # Can be null
        trip.end_date = body.end_date

    await db.commit()
    await db.refresh(trip)
    return TripRead.model_validate(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a trip."""
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    await db.delete(trip)
    await db.commit()


# ── Itinerary Management ───────────────────────────────────────────────────────

@router.post("/{trip_id}/items", response_model=ItineraryItemRead, status_code=status.HTTP_201_CREATED)
async def add_itinerary_item(
    trip_id: int,
    body: ItineraryItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryItemRead:
    """Add a saved place to a trip's itinerary."""
    # 1. Verify trip exists and belongs to user
    trip_res = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    if trip_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    # 2. Verify place exists and belongs to user
    place_res = await db.execute(
        select(Place).where(Place.id == body.place_id, Place.user_id == current_user.id)
    )
    if place_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")

    # 3. Add item
    item = ItineraryItem(
        trip_id=trip_id,
        place_id=body.place_id,
        day_number=body.day_number,
        order=body.order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    # Reload with place details
    result = await db.execute(
        select(ItineraryItem)
        .options(selectinload(ItineraryItem.place))
        .where(ItineraryItem.id == item.id)
    )
    return ItineraryItemRead.model_validate(result.scalar_one())


@router.delete("/{trip_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_itinerary_item(
    trip_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a place from a trip's itinerary."""
    # Verify trip ownership implicitly by checking item belongs to trip and trip belongs to user
    result = await db.execute(
        select(ItineraryItem)
        .join(Trip)
        .where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id, Trip.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    
    await db.delete(item)
    await db.commit()


@router.patch("/{trip_id}/items/reorder", status_code=status.HTTP_200_OK)
async def reorder_itinerary(
    trip_id: int,
    body: ReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Bulk update day_number and order for drag-and-drop support."""
    # Verify trip ownership
    trip_res = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    if trip_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    # Fetch all items being updated
    item_ids = [i.id for i in body.items]
    items_res = await db.execute(
        select(ItineraryItem).where(ItineraryItem.id.in_(item_ids), ItineraryItem.trip_id == trip_id)
    )
    existing_items = {i.id: i for i in items_res.scalars().all()}

    # Update in memory
    for update in body.items:
        if update.id in existing_items:
            existing_items[update.id].day_number = update.day_number
            existing_items[update.id].order = update.order

    await db.commit()
    return {"status": "success", "updated": len(existing_items)}
