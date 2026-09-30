"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Trip {
  id: int;
  title: string;
  start_date: string | null;
  end_date: string | null;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else fetchTrips();
  }, [router]);

  const fetchTrips = async () => {
    try {
      const { data } = await api.get<Trip[]>("/trips");
      setTrips(data);
    } catch {
      // Ignored for now
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data } = await api.post<Trip>("/trips", { title: newTitle.trim() });
      router.push(`/trips/${data.id}`);
    } catch {
      alert("Failed to create trip.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="flex items-center gap-2 text-xl font-bold">
          <span>🗺️</span> TripKeeper
        </a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Trips</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
            <span className="text-5xl">🗓️</span>
            <h2 className="mt-4 text-xl font-medium">No trips yet</h2>
            <p className="mt-2 text-gray-500">Create your first trip to start planning.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <a
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-indigo-500 transition-all group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">✈️</div>
                <h2 className="text-xl font-bold truncate">{trip.title}</h2>
                <p className="text-sm text-gray-500 mt-2">
                  {trip.start_date && trip.end_date
                    ? `${trip.start_date} to ${trip.end_date}`
                    : "Dates pending"}
                </p>
              </a>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create a new trip</h2>
            <form onSubmit={handleCreateTrip}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Trip Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Summer in Paris"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
