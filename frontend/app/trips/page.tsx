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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-8 py-6 flex items-center justify-between">
        <a href="/dashboard" className="font-serif text-2xl font-bold tracking-widest uppercase">
          TripKeeper
        </a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors tracking-widest uppercase font-medium">
          ← Dashboard
        </a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-wide">Your Trips</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-[#e87a5d] hover:bg-[#d66b4f] rounded-full font-medium tracking-wide transition-all shadow-lg"
          >
            + New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-32 bg-[#0f0f0f] rounded-2xl border border-white/5">
            <h2 className="text-2xl font-serif font-medium tracking-wide">No journeys planned yet</h2>
            <p className="mt-4 text-gray-500 font-light">Create your first trip to start curating.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => (
              <a
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block p-8 bg-[#0f0f0f] border border-white/5 rounded-2xl hover:border-[#e87a5d]/50 hover:bg-[#141414] transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 group-hover:border-[#e87a5d]"></div>
                </div>
                <h2 className="text-2xl font-serif tracking-wide truncate">{trip.title}</h2>
                <p className="text-sm text-gray-500 mt-3 font-light">
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
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-serif tracking-wide mb-6">Create a new journey</h2>
            <form onSubmit={handleCreateTrip}>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-400 mb-3 tracking-wide">Trip Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Summer in Paris"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#e87a5d] transition-colors"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-full font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-6 py-3 bg-[#e87a5d] hover:bg-[#d66b4f] rounded-full font-medium tracking-wide transition-colors disabled:opacity-50"
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
