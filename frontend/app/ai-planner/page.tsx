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
        </div>
        <h2 className="font-serif text-3xl font-medium mb-3 tracking-wide">
          Curating your journey...
        </h2>
        <p className="text-gray-400 text-center max-w-sm font-light">
          Our intelligence is exploring destinations, discovering hidden gems, and structuring your ideal itinerary. This may take a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/10 px-8 py-6 flex items-center justify-between">
        <a href="/dashboard" className="font-serif text-2xl font-bold tracking-widest uppercase">
          TripKeeper
        </a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-wide mb-4">
            AI Itinerary Generator
          </h1>
          <p className="text-gray-400 font-light text-lg">Provide a destination, and let us intelligently craft your entire journey.</p>
        </div>

        <div className="bg-[#0f0f0f] border border-white/5 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Subtle gradient background decoration */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
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
              className="w-full py-4 mt-4 bg-[#e87a5d] hover:bg-[#d66b4f] rounded-xl font-medium text-lg tracking-wide transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Generate Itinerary
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
