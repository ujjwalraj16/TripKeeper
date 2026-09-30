# TripKeeper — Build Progress

## Project Status: 🟢 Phase 3 Complete

---

## Phase Tracker

| # | Phase | Status | Started | Completed |
|---|---|---|---|---|
| 1 | Setup | ✅ Done | 2026-09-30 | 2026-09-30 |
| 2 | Authentication | ✅ Done | 2026-09-30 | 2026-09-30 |
| 3 | Places & Map | ✅ Done | 2026-09-30 | 2026-09-30 |
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
**Status:** ✅ Done

**Deliverables:**
- [x] `User` SQLAlchemy model
- [x] Pydantic schemas (UserCreate, UserRead, Token, TokenData)
- [x] Password hashing with `passlib[bcrypt]` (pinned bcrypt==4.2.1 for Python 3.14)
- [x] `POST /auth/register` — returns 201 + JWT
- [x] `POST /auth/login` — returns JWT
- [x] `GET /auth/me` — returns current user profile
- [x] `get_current_user` FastAPI dependency in `core/deps.py`
- [x] Frontend: `/register` page with controlled form + error display
- [x] Frontend: `/login` page with controlled form + error display
- [x] Frontend: `/dashboard` protected page (redirects to /login if no token)
- [x] Token + user stored in localStorage via `lib/auth.ts`
- [x] 11/11 pytest tests passing

---

### Phase 3 — Places & Map
**Goal:** Place CRUD, Nominatim search, Leaflet map.
**Status:** ✅ Done

**Deliverables:**
- [x] `Place` SQLAlchemy model (lat/lon, name, category, display_name, notes, user_id FK)
- [x] CRUD routes scoped to logged-in user (`GET /places`, `POST /places`, `GET /places/{id}`, `DELETE /places/{id}`)
- [x] `GET /places/search?q=` via Nominatim (proxied server-side with async subprocess curl)
- [x] Frontend: `/places` page with Leaflet map (SSR disabled via `next/dynamic`)
- [x] Search box with 500ms debounce + hover-to-preview markers on map
- [x] Click-to-save flow with indigo preview markers and green saved markers
- [x] Saved places list with delete button (visible on hover)
- [x] Dashboard "Places" card now links to `/places` and shows "✓ Live" badge

**Notes:**
- Nominatim blocks Python's httpx HTTP/2 fingerprint on some networks; fixed with async subprocess curl
- Leaflet icon paths fixed for Next.js/webpack bundler
- Map auto-fits bounds to saved places; flyTo animation on search preview

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
