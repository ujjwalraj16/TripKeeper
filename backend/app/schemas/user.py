"""
schemas/user.py — Pydantic v2 schemas for user registration, login, and token responses.
These define what the API accepts as input and returns as output.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ── Request bodies ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Body for POST /auth/register."""
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """Usernames: 3-30 chars, letters/numbers/underscores only."""
        v = v.strip()
        if not (3 <= len(v) <= 30):
            raise ValueError("Username must be between 3 and 30 characters.")
        if not v.replace("_", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, and underscores.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class UserLogin(BaseModel):
    """Body for POST /auth/login."""
    email: EmailStr
    password: str


# ── Response bodies ────────────────────────────────────────────────────────────

class UserRead(BaseModel):
    """Safe user data returned to the client (no password)."""
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # allows ORM → Pydantic conversion


class Token(BaseModel):
    """JWT token response returned after login / register."""
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    """Payload stored inside the JWT (used by get_current_user)."""
    user_id: int | None = None
