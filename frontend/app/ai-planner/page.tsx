"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AIPlannerPage() {
  const router = useRouter();
  
  const [form, setForm] = useState({ destination: "", days: 3, theme: "Relaxing" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Endpoint returns the created Trip with items
      const { data } = await api.post("/ai/plan", {
        destination: form.destination.trim(),
        days: form.days,
        theme: form.theme
      });
      
      // Navigate straight to the trip view!
      router.push(`/trips/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate AI plan. Is Ollama running?");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🤖</div>
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Crafting your perfect trip...
        </h2>
        <p className="text-gray-400 text-center max-w-sm">
          Our AI is exploring the map, discovering hidden gems, and building your itinerary. This can take 30-60 seconds depending on your hardware.
        </p>
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Itinerary Generator
          </h1>
          <p className="mt-3 text-gray-400">Tell us where you want to go, and let the AI do the heavy lifting.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-xl relative overflow-hidden">
          {/* Subtle gradient background decoration */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Where are you going?</label>
              <input
                type="text"
                autoFocus
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="e.g. Tokyo, Japan"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  required
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trip Theme</label>
                <select
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option>Relaxing</option>
                  <option>Adventure</option>
                  <option>Foodie</option>
                  <option>Culture & History</option>
                  <option>Nightlife</option>
                  <option>Nature & Outdoors</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!form.destination.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              Generate Itinerary <span>🚀</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
