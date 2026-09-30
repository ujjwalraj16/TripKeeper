"""
schemas/trip.py — Pydantic schemas for the Trip and ItineraryItem resources.
"""

from datetime import date, datetime
from pydantic import BaseModel, Field

from app.schemas.place import PlaceRead
from app.schemas.user import UserRead

class CollaboratorRead(BaseModel):
    id: int
    user_id: int
    role: str
    user: UserRead

    model_config = {"from_attributes": True}


class ItineraryItemBase(BaseModel):
    place_id: int
    day_number: int = Field(default=1, ge=1)
    order: int = Field(default=0, ge=0)


class ItineraryItemCreate(ItineraryItemBase):
    pass


class ItineraryItemRead(ItineraryItemBase):
    id: int
    trip_id: int
    place: PlaceRead

    model_config = {"from_attributes": True}


class TripBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    share_token: str | None = None


class TripRead(TripBase):
    id: int
    user_id: int
    share_token: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TripWithItinerary(TripRead):
    items: list[ItineraryItemRead] = []
    collaborators: list[CollaboratorRead] = []


class ReorderItem(BaseModel):
    id: int
    day_number: int = Field(..., ge=1)
    order: int = Field(..., ge=0)


class ReorderRequest(BaseModel):
    items: list[ReorderItem]
