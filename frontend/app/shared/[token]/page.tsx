"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";

const TripMap = dynamic(() => import("@/components/map/TripMap"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Place {
  id: number;
  name: string;
  category?: string | null;
  lat: number;
  lon: number;
}

interface ItineraryItem {
  id: number;
  day_number: number;
  order: number;
  place: Place;
}

interface Trip {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  items: ItineraryItem[];
}

export default function SharedTripPage() {
  const { token } = useParams();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTrip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchTrip = async () => {
    try {
      const { data } = await api.get<Trip>(`/trips/shared/${token}`);
      setTrip(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <span className="text-6xl mb-4">🚫</span>
        <h1 className="text-2xl font-bold">Trip Not Found</h1>
        <p className="text-gray-500 mt-2">This link is invalid or the trip was deleted.</p>
      </div>
    );
  }

  // Determine the max day
  const maxDay = Math.max(1, ...trip.items.map((i) => i.day_number));
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <nav className="flex-none border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span>🗺️</span> TripKeeper
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-medium text-gray-300">{trip.title} <span className="text-sm px-2 py-0.5 ml-2 bg-indigo-900/50 text-indigo-300 rounded-full font-semibold uppercase tracking-widest">Shared View</span></h1>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Read-Only Itinerary */}
        <div className="flex-1 overflow-x-auto p-6 flex gap-6">
          {days.map((day) => {
            const dayItems = trip.items
              .filter((i) => i.day_number === day)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={day} className="flex-none w-[320px] flex flex-col bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-gray-900">
                  <h2 className="font-bold">Day {day}</h2>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-3">
                    {dayItems.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">No places for this day.</p>
                    ) : (
                      dayItems.map((item, index) => (
                        <div key={item.id} className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-start gap-3">
                          <div className="mt-0.5 text-indigo-500 font-bold text-xs bg-indigo-500/10 w-5 h-5 flex items-center justify-center rounded-full flex-none">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.place.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.place.category ?? "Place"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="w-[450px] border-l border-gray-800 p-4 bg-gray-950 hidden xl:block relative z-0">
          <TripMap items={trip.items} />
        </div>
      </div>
    </div>
  );
}
