"""
schemas/ai.py — Pydantic models for AI planner.
"""

from typing import List
from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    destination: str = Field(..., min_length=2, max_length=100)
    days: int = Field(..., ge=1, le=14)
    theme: str = Field(..., description="e.g., Relaxing, Adventure, Foodie, Culture")


# ── Internal Ollama Parsing Schemas ───────────────────────────────────────────

class AIActivity(BaseModel):
    name: str = Field(..., description="Name of the place or activity.")
    category: str = Field(..., description="e.g., restaurant, museum, park")


class AIDay(BaseModel):
    day: int
    activities: List[AIActivity] = Field(..., min_length=1)


class AIPlanResult(BaseModel):
    title: str = Field(..., description="A catchy title for the trip.")
    itinerary: List[AIDay]
