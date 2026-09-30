"use client";
/**
 * app/dashboard/page.tsx — Protected dashboard stub.
 * Reads the token from localStorage; redirects to /login if missing.
 * Will be expanded in later phases with trips, places, and map.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearAuth } from "@/lib/auth";

interface UserProfile {
  id: number;
  email: string;
  username: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(getUser<UserProfile>());
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🗺️</span> TripKeeper
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Hey, <span className="text-white font-medium">{user.username}</span> 👋
          </span>
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        {/* Welcome hero */}
        <div className="mb-12">
          <span className="text-6xl">🏝️</span>
          <h1 className="mt-4 text-4xl font-bold">
            Welcome to your dashboard
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            Your trips and saved places will appear here.
          </p>
        </div>

        {/* Feature cards — placeholders for upcoming phases */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "📍", label: "Places", desc: "Save and organise your favourite spots", href: "#", phase: 3 },
            { icon: "🗓️", label: "Trips", desc: "Plan day-by-day itineraries", href: "#", phase: 4 },
            { icon: "🤖", label: "AI Planner", desc: "Let AI generate your itinerary", href: "#", phase: 6 },
          ].map(({ icon, label, desc, href, phase }) => (
            <a
              key={label}
              href={href}
              className="group flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-800
                         rounded-2xl hover:border-indigo-700 hover:bg-gray-800/60 transition-all"
            >
              <span className="text-4xl">{icon}</span>
              <h2 className="text-lg font-semibold">{label}</h2>
              <p className="text-sm text-gray-500 text-center">{desc}</p>
              <span className="text-xs text-indigo-500 mt-auto">Coming in Phase {phase}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
