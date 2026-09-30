# TripKeeper — Agent Specification

## Project Overview
TripKeeper is a full-stack trip planning web app built as a placement-ready portfolio project.

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Frontend | Next.js (App Router, TypeScript), Tailwind CSS, react-leaflet |
| Maps | OpenStreetMap (Leaflet), Nominatim (place search), OSRM (routing) |
| AI | Ollama (local, qwen2.5:7b), sentence-transformers, ChromaDB |
| Drag & Drop | dnd-kit |
| HTTP | axios |

## Global Rules
- Work one phase at a time — verify before proceeding.
- Show a short plan before each phase and wait for approval.
- All config lives in `.env`; never hardcode secrets.
- No Docker, no docker-compose, no PostgreSQL.
- Use type hints, brief comments, clean folder structure.
- Validate all LLM output with Pydantic; retry up to 3 times on failure.
- After each phase: provide run/test instructions + git commit message.

## Project Structure
```
tripkeeper/
  backend/
    app/
      main.py
      core/          # config, security, database
      models/        # SQLAlchemy models
      schemas/       # Pydantic schemas
      api/routes/    # FastAPI route handlers
      services/      # business logic (AI, geocoding, routing)
    requirements.txt
    .env / .env.example
  frontend/          # Next.js App Router
    app/
    components/
    lib/
  README.md
  .gitignore
```

## Phases Summary
| # | Phase | Status |
|---|---|---|
| 1 | Setup (skeleton, health endpoint, Next.js base) | Pending |
| 2 | Authentication (JWT, register/login, frontend pages) | Pending |
| 3 | Places & Map (CRUD, Nominatim search, Leaflet) | Pending |
| 4 | Trips & Itinerary (day-wise, dnd-kit, route map) | Pending |
| 5 | Sharing (share token, collaborators, permissions) | Pending |
| 6 | AI Features (plan generator, route optimizer, Ollama) | Pending |
| 7 | AI Agent (tool calling, chat panel, agent loop) | Pending |
| 8 | Polish (README, error handling, loading states) | Pending |

## AI Agent Design (Phase 7)
- **Model**: Ollama `qwen2.5:7b` (configurable via `OLLAMA_MODEL`)
- **Tools**:
  - `add_place_to_trip` — adds a saved place to a trip day
  - `remove_place` — removes a place from the itinerary
  - `optimize_route` — runs nearest-neighbor + 2-opt on a day
  - `get_weather` — fetches weather for a location/date
  - `estimate_budget` — estimates trip cost breakdown
  - `search_places` — searches Nominatim for places
- **Agent Loop**: call → execute tool → return result → repeat (max 5 iterations)
- **Guardrails**: Pydantic validation on all tool args; friendly error on invalid calls; only act on trips the current user can edit; log every tool call.
