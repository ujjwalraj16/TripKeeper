"""
models/collaborator.py — SQLAlchemy TripCollaborator model.
Allows users to share trips with others, giving them viewer or editor roles.
"""

from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TripCollaborator(Base):
    __tablename__ = "trip_collaborators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="viewer") # "viewer" or "editor"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    trip = relationship("Trip", back_populates="collaborators", lazy="noload")
    user = relationship("User", lazy="joined") # Eager load user details to show who is collaborating
