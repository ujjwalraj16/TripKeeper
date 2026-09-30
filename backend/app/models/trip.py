"""
models/trip.py — SQLAlchemy Trip model.
Stores user's trips.
"""

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    share_token: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="trips", lazy="noload")
    items = relationship(
        "ItineraryItem", 
        back_populates="trip", 
        lazy="selectin", 
        cascade="all, delete-orphan",
        order_by="ItineraryItem.day_number, ItineraryItem.order"
    )
    collaborators = relationship(
        "TripCollaborator",
        back_populates="trip",
        lazy="selectin",
        cascade="all, delete-orphan"
    )
