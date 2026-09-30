"use client";
/**
 * app/places/page.tsx — Places & Map page (Phase 3).
 *
 * Layout:
 *   Left panel (40%): search box → results list → saved places list
 *   Right panel (60%): full-height Leaflet map
 *
 * UX flow:
 *   1. User types in search box → Nominatim results appear
 *   2. Hovering a result previews its marker on the map
 *   3. Clicking "Save" saves it to the backend
 *   4. Saved places are listed below and shown as green markers
 *   5. Saved places can be deleted via trash icon
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

// Leaflet map must be loaded client-side only (no SSR)
const PlacesMap = dynamic(() => import("@/components/map/PlacesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: number;
  lon: number;
  category?: string | null;
  type?: string | null;
}

interface SavedPlace {
  id: number;
  name: string;
  display_name?: string | null;
  lat: number;
  lon: number;
  category?: string | null;
  notes?: string | null;
  created_at: string;
}

interface PreviewMarker {
  lat: number;
  lon: number;
  name: string;
}

export default function PlacesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [previewMarker, setPreviewMarker] = useState<PreviewMarker | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null); // place_id being saved
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  // Load saved places on mount
  useEffect(() => {
    fetchSavedPlaces();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSavedPlaces = async () => {
    try {
      const { data } = await api.get<SavedPlace[]>("/places");
      setSavedPlaces(data);
    } catch {
      // Silently fail on load; user will see an empty list
    }
  };

  // Debounced Nominatim search
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<NominatimResult[]>("/places/search", {
          params: { q: value, limit: 8 },
        });
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  const handleSavePlace = async (result: NominatimResult) => {
    setSavingId(result.place_id);
    try {
      const { data } = await api.post<SavedPlace>("/places", {
        name: result.display_name.split(",")[0].trim(),
        display_name: result.display_name,
        category: result.category ?? result.type,
        lat: result.lat,
        lon: result.lon,
      });
      setSavedPlaces((prev) => [data, ...prev]);
      showToast(`"${data.name}" saved!`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      showToast(e?.response?.data?.detail ?? "Failed to save place.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeletePlace = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/places/${id}`);
      setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
      showToast("Place removed.");
    } catch {
      showToast("Failed to delete place.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const categoryIcon = (cat?: string | null) => {
    if (!cat) return "📍";
    if (cat.includes("restaurant") || cat.includes("food")) return "🍽️";
    if (cat.includes("hotel") || cat.includes("accommodation")) return "🏨";
    if (cat.includes("tourism") || cat.includes("museum")) return "🏛️";
    if (cat.includes("natural") || cat.includes("park")) return "🌿";
    if (cat.includes("transport") || cat.includes("airport")) return "✈️";
    if (cat.includes("shop")) return "🛍️";
    return "📍";
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="flex-none border-b border-white/10 px-8 py-6 flex items-center justify-between bg-[#0a0a0a] z-10">
        <a href="/dashboard" className="font-serif text-2xl font-bold tracking-widest uppercase">
          TripKeeper
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors tracking-widest uppercase font-medium"
            id="nav-dashboard"
          >
            ← Dashboard
          </a>
        </div>
      </nav>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-[420px] flex-none flex flex-col border-r border-white/5 overflow-y-auto bg-[#0a0a0a]">
          {/* Search */}
          <div className="p-6 border-b border-white/5 bg-[#0f0f0f]">
            <h1 className="text-xl font-serif tracking-wide mb-4">
              Saved Places
            </h1>
            <div className="relative">
              <input
                id="place-search-input"
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search for a place…"
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-5 py-3 pr-10
                           text-sm placeholder-gray-500 focus:outline-none focus:border-[#e87a5d]
                           transition-all"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!searching && query && (
                <button
                  onClick={() => { setQuery(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  id="clear-search-btn"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="flex-none">
              <p className="px-5 pt-4 pb-2 text-xs text-gray-500 uppercase tracking-widest font-semibold">
                Search Results
              </p>
              <ul className="divide-y divide-gray-800/60">
                {searchResults.map((r) => (
                  <li
                    key={r.place_id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    onMouseEnter={() => setPreviewMarker({ lat: r.lat, lon: r.lon, name: r.display_name.split(",")[0] })}
                    onMouseLeave={() => setPreviewMarker(null)}
                  >
                    <span className="text-xl mt-0.5 flex-none">{categoryIcon(r.category ?? r.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.display_name.split(",")[0]}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{r.display_name}</p>
                      {r.category && (
                        <span className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">
                          {r.category}
                        </span>
                      )}
                    </div>
                    <button
                      id={`save-btn-${r.place_id}`}
                      onClick={(e) => { e.stopPropagation(); handleSavePlace(r); }}
                      disabled={savingId === r.place_id}
                      className="flex-none mt-0.5 text-xs px-4 py-2 bg-[#e87a5d] hover:bg-[#d66b4f]
                                 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {savingId === r.place_id ? "…" : "Save"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {query.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Divider */}
          <div className="border-t border-gray-800 mt-2" />

          {/* Saved places */}
          <div className="flex-1">
            <p className="px-5 pt-4 pb-2 text-xs text-gray-500 uppercase tracking-widest font-semibold">
              Saved Places ({savedPlaces.length})
            </p>
            {savedPlaces.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="mt-3 text-sm text-gray-500 font-light">
                  Search for a place and save it to see it here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-800/60">
                {savedPlaces.map((place) => (
                  <li
                    key={place.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors group"
                    onMouseEnter={() => setPreviewMarker({ lat: place.lat, lon: place.lon, name: place.name })}
                    onMouseLeave={() => setPreviewMarker(null)}
                  >
                    <span className="text-xl mt-0.5 flex-none">{categoryIcon(place.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{place.name}</p>
                      {place.display_name && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{place.display_name}</p>
                      )}
                      {place.category && (
                        <span className="mt-1 inline-block text-[10px] uppercase tracking-widest bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-full">
                          {place.category}
                        </span>
                      )}
                    </div>
                    <button
                      id={`delete-place-${place.id}`}
                      onClick={() => handleDeletePlace(place.id)}
                      disabled={deletingId === place.id}
                      className="flex-none mt-0.5 p-1.5 rounded-lg text-gray-600 hover:text-red-400
                                 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete place"
                    >
                      {deletingId === place.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Right panel — Map */}
        <main className="flex-1 relative">
          <PlacesMap
            savedPlaces={savedPlaces}
            previewMarker={previewMarker}
          />
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm
                      font-medium shadow-2xl backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-4
                      ${toast.type === "success"
                        ? "bg-emerald-900/90 border border-emerald-700 text-emerald-200"
                        : "bg-red-900/90 border border-red-700 text-red-200"
                      }`}
          id="toast-notification"
        >
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
