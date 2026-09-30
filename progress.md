# TripKeeper — Build Progress

## Project Status: 🟢 Phase 1 Complete

---

## Phase Tracker

| # | Phase | Status | Started | Completed |
|---|---|---|---|---|
| 1 | Setup | ✅ Done | 2026-09-30 | 2026-09-30 |
| 2 | Authentication | ⏳ Pending | — | — |
| 3 | Places & Map | ⏳ Pending | — | — |
| 4 | Trips & Itinerary | ⏳ Pending | — | — |
| 5 | Sharing | ⏳ Pending | — | — |
| 6 | AI Features | ⏳ Pending | — | — |
| 7 | AI Agent | ⏳ Pending | — | — |
| 8 | Polish | ⏳ Pending | — | — |

---

## Phase Details

### Phase 1 — Setup
**Goal:** Project skeleton, FastAPI health endpoint, Next.js base.
**Status:** ⏳ Pending approval

**Deliverables:**
- [x] `backend/` folder with `venv`, `requirements.txt`, `app/main.py`
- [x] FastAPI CORS configured for `localhost:3000`
- [x] SQLite `database.py` with SQLAlchemy 2.0 engine
- [x] `GET /health` endpoint returns `{"status": "ok", "version": "0.1.0"}` ✅
- [x] FastAPI `/docs` returns HTTP 200 ✅
- [x] `frontend/` with Next.js 16 + TypeScript + Tailwind CSS initialized ✅
- [x] `react-leaflet`, `leaflet`, `@dnd-kit/*`, `axios` installed ✅
- [x] Next.js dev server serves homepage at localhost:3000 (HTTP 200) ✅
- [x] `.gitignore`, `.env.example`, `git init` done ✅

**Notes:**
- Port 8000 in use by another project; TripKeeper backend runs on **port 8001**
- Python 3.14 required `greenlet` installed separately for SQLAlchemy async
- Next.js 16 (latest) scaffolded successfully

---

### Phase 2 — Authentication
**Goal:** JWT-based register/login with frontend pages.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] `User` SQLAlchemy model
- [ ] Pydantic schemas (UserCreate, UserRead, Token)
- [ ] Password hashing with `passlib[bcrypt]`
- [ ] `POST /auth/register` and `POST /auth/login`
- [ ] `get_current_user` FastAPI dependency
- [ ] Frontend: `/login` and `/register` pages
- [ ] Token stored in localStorage; redirect to `/dashboard`
- [ ] Basic auth route tests

---

### Phase 3 — Places & Map
**Goal:** Place CRUD, Nominatim search, Leaflet map.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] `Place` SQLAlchemy model
- [ ] CRUD routes scoped to logged-in user
- [ ] `GET /places/search?q=` via Nominatim
- [ ] Frontend: Places page with Leaflet map (SSR disabled)
- [ ] Search box + click-to-save flow
- [ ] Saved places list with markers on map

---

### Phase 4 — Trips & Itinerary
**Goal:** Day-wise itinerary with drag-and-drop and route map.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] `Trip`, `ItineraryItem` SQLAlchemy models
- [ ] Trip CRUD routes
- [ ] Add/remove places to a day
- [ ] `PATCH /trips/{id}/items/reorder`
- [ ] Frontend: Trips list page
- [ ] Trip detail page with day-wise columns
- [ ] Drag-and-drop with `dnd-kit`
- [ ] Map showing trip stops connected in order

---

### Phase 5 — Sharing
**Goal:** Share trips via token or collaborator invite.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] `share_token` UUID on Trip model
- [ ] `GET /trips/shared/{token}` (public, read-only)
- [ ] `TripCollaborator` model (viewer / editor roles)
- [ ] Permission enforcement on all trip routes
- [ ] Frontend: Share button + public trip view page

---

### Phase 6 — AI Features (Ollama)
**Goal:** AI itinerary generator + route optimizer.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] `POST /ai/plan` — Ollama structured output with Pydantic validation
- [ ] Geocode each stop and save as a real trip
- [ ] Up to 3 retries on invalid LLM output
- [ ] Nearest-neighbor + 2-opt route optimizer service
- [ ] Friendly error if Ollama is not running / model not pulled
- [ ] `OLLAMA_MODEL` and `OLLAMA_HOST` from `.env`
- [ ] Loading states in UI

---

### Phase 7 — AI Agent (Ollama)
**Goal:** Tool-calling agent that edits trips via chat.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] 6 tools: `add_place_to_trip`, `remove_place`, `optimize_route`, `get_weather`, `estimate_budget`, `search_places`
- [ ] Agent loop (max 5 iterations)
- [ ] Pydantic validation on all tool arguments
- [ ] `POST /ai/agent/chat`
- [ ] Chat panel on trip detail page
- [ ] Permission check (editor/owner only)
- [ ] Tool call logging

---

### Phase 8 — Polish
**Goal:** README, error handling, loading states.
**Status:** ⏳ Pending

**Deliverables:**
- [ ] README with features, architecture diagram, setup steps
- [ ] Ollama install + `ollama pull qwen2.5:7b` instructions
- [ ] Global error boundaries and loading skeletons in frontend
- [ ] Screenshot placeholders in README

---

## Git Commit Log
- `65f6578` — `chore: Phase 1 — project skeleton (FastAPI + Next.js)`
- `03c9a33` — `fix: absorb frontend into root git repo (remove embedded .git)`

---

## Notes / Decisions
- No Docker or deployment config at any phase.
- SQLite file stored at `backend/tripkeeper.db`.
- All secrets read from `.env`; `.env.example` committed.
