"""
schemas/place.py — Pydantic schemas for the Place resource.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PlaceCreate(BaseModel):
    """Payload for saving a new place."""
    name: str = Field(..., min_length=1, max_length=255, examples=["Eiffel Tower"])
    display_name: str | None = Field(None, description="Full Nominatim display string")
    category: str | None = Field(None, max_length=100, examples=["tourism"])
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    notes: str | None = Field(None, max_length=2000)


class PlaceRead(BaseModel):
    """Response schema for a saved place."""
    id: int
    user_id: int
    name: str
    display_name: str | None
    category: str | None
    lat: float
    lon: float
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NominatimResult(BaseModel):
    """A single result returned by the Nominatim search proxy."""
    place_id: int
    display_name: str
    lat: float
    lon: float
    category: str | None = None
    type: str | None = None
