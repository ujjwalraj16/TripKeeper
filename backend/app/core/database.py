"""
core/database.py — Async SQLAlchemy 2.0 engine + session factory
Uses aiosqlite so database calls don't block the event loop.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Create the async engine.
# check_same_thread=False is needed for SQLite (safe with async).
engine = create_async_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=False,  # set True to log SQL queries during debugging
)

# Session factory — use this to create database sessions in route handlers
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keep objects usable after commit
)


class Base(DeclarativeBase):
    """All SQLAlchemy models inherit from this base class."""
    pass


async def init_db() -> None:
    """Create all tables on startup (safe to call multiple times)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields a database session per request
    and closes it automatically when the request is done.
    """
    async with AsyncSessionLocal() as session:
        yield session
