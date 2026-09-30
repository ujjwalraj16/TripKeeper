"""
main.py — FastAPI application entry point
Sets up CORS, registers routers, and initialises the database on startup.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks (create DB tables) then yield to serve requests."""
    await init_db()
    yield
    # Nothing to clean up yet; add teardown here later if needed.


app = FastAPI(
    title="TripKeeper API",
    description="A trip planning app — placement-ready portfolio project.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server (localhost:3000) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe — returns 200 OK with a status message."""
    return {"status": "ok", "version": app.version}


# Future routers will be included here, e.g.:
# from app.api.routes import auth, places, trips
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
