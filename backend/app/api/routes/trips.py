"""
api/routes/trips.py — Trip & Itinerary CRUD endpoints with Collaboration support.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.collaborator import TripCollaborator
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


async def _get_trip_or_404(db: AsyncSession, trip_id: int, user_id: int, require_edit: bool = False) -> Trip:
    """
    Helper to fetch a trip and ensure the user has permission to access it.
    Owner always has access. Collaborators have access depending on role.
    """
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.items).joinedload(ItineraryItem.place),
            selectinload(Trip.collaborators).joinedload(TripCollaborator.user)
        )
        .where(Trip.id == trip_id)
    )
    trip = result.scalar_one_or_none()
    
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")

    if trip.user_id == user_id:
        return trip # Owner has full access

    # Check collaborators
    for collab in trip.collaborators:
        if collab.user_id == user_id:
            if require_edit and collab.role != "editor":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You need editor permissions.")
            return trip

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this trip.")


# ── Trip CRUD ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list[TripRead])
async def list_trips(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TripRead]:
    """Return all trips owned by OR shared with the current user."""
    # Subquery for shared trips
    shared_trips_query = select(TripCollaborator.trip_id).where(TripCollaborator.user_id == current_user.id)
    
    result = await db.execute(
        select(Trip)
        .where(or_(Trip.user_id == current_user.id, Trip.id.in_(shared_trips_query)))
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
        share_token=str(uuid.uuid4())
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return TripRead.model_validate(trip)


@router.get("/shared/{token}", response_model=TripWithItinerary)
async def get_public_trip(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> TripWithItinerary:
    """Public, read-only endpoint for viewing a shared trip via token."""
    result = await db.execute(
        select(Trip)
        .options(selectinload(Trip.items).joinedload(ItineraryItem.place))
        .where(Trip.share_token == token)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid share link or trip not found.")
    return TripWithItinerary.model_validate(trip)


@router.get("/{trip_id}", response_model=TripWithItinerary)
async def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripWithItinerary:
    """Return a single trip with its full itinerary."""
    trip = await _get_trip_or_404(db, trip_id, current_user.id, require_edit=False)
    return TripWithItinerary.model_validate(trip)


@router.put("/{trip_id}", response_model=TripRead)
async def update_trip(
    trip_id: int,
    body: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TripRead:
    """Update a trip's details."""
    trip = await _get_trip_or_404(db, trip_id, current_user.id, require_edit=True)

    if body.title is not None:
        trip.title = body.title
    if body.start_date is not NotImplemented:
        trip.start_date = body.start_date
    if body.end_date is not NotImplemented:
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
    """Delete a trip. Only the owner can delete the trip."""
    # Do not use helper here because collaborators cannot delete the trip
    result = await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or not owner.")
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
    await _get_trip_or_404(db, trip_id, current_user.id, require_edit=True)

    # Verify place exists and belongs to user (or is public - but right now places are private)
    # Ideally, if it's a collaborative trip, they might add THEIR places.
    place_res = await db.execute(
        select(Place).where(Place.id == body.place_id, Place.user_id == current_user.id)
    )
    if place_res.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found in your saved places.")

    item = ItineraryItem(
        trip_id=trip_id,
        place_id=body.place_id,
        day_number=body.day_number,
        order=body.order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
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
    await _get_trip_or_404(db, trip_id, current_user.id, require_edit=True)

    result = await db.execute(
        select(ItineraryItem).where(ItineraryItem.id == item_id, ItineraryItem.trip_id == trip_id)
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
    await _get_trip_or_404(db, trip_id, current_user.id, require_edit=True)

    item_ids = [i.id for i in body.items]
    items_res = await db.execute(
        select(ItineraryItem).where(ItineraryItem.id.in_(item_ids), ItineraryItem.trip_id == trip_id)
    )
    existing_items = {i.id: i for i in items_res.scalars().all()}

    for update in body.items:
        if update.id in existing_items:
            existing_items[update.id].day_number = update.day_number
            existing_items[update.id].order = update.order

    await db.commit()
    return {"status": "success", "updated": len(existing_items)}
