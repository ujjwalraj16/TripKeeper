"""
api/routes/places.py — Place CRUD + Nominatim search proxy.

Routes:
  GET    /places/search?q=   → proxy Nominatim, return results
  GET    /places             → list all saved places for current user
  POST   /places             → save a new place
  GET    /places/{id}        → get one saved place (must belong to user)
  DELETE /places/{id}        → delete a saved place
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.place import Place
from app.models.user import User
from app.schemas.place import PlaceCreate, PlaceRead
from app.services.geocoding import search_nominatim

router = APIRouter()


# ── Nominatim search proxy ─────────────────────────────────────────────────────

@router.get("/search", response_model=list[dict])
async def search_places(
    q: str = Query(..., min_length=2, description="Free-text place search query"),
    limit: int = Query(8, ge=1, le=20),
    _: User = Depends(get_current_user),  # must be logged in
) -> list[dict]:
    """Proxy Nominatim search so the API key / User-Agent stays server-side."""
    results = await search_nominatim(q, limit=limit)
    return results


# ── CRUD ───────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PlaceRead])
async def list_places(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PlaceRead]:
    """Return all places saved by the current user, newest first."""
    result = await db.execute(
        select(Place)
        .where(Place.user_id == current_user.id)
        .order_by(Place.created_at.desc())
    )
    places = result.scalars().all()
    return [PlaceRead.model_validate(p) for p in places]


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
async def create_place(
    body: PlaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlaceRead:
    """Save a new place for the current user."""
    place = Place(
        user_id=current_user.id,
        name=body.name,
        display_name=body.display_name,
        category=body.category,
        lat=body.lat,
        lon=body.lon,
        notes=body.notes,
    )
    db.add(place)
    await db.commit()
    await db.refresh(place)
    return PlaceRead.model_validate(place)


@router.get("/{place_id}", response_model=PlaceRead)
async def get_place(
    place_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlaceRead:
    """Return a single saved place (must belong to the current user)."""
    result = await db.execute(
        select(Place).where(Place.id == place_id, Place.user_id == current_user.id)
    )
    place = result.scalar_one_or_none()
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    return PlaceRead.model_validate(place)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_place(
    place_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a saved place (must belong to the current user)."""
    result = await db.execute(
        select(Place).where(Place.id == place_id, Place.user_id == current_user.id)
    )
    place = result.scalar_one_or_none()
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    await db.delete(place)
    await db.commit()
