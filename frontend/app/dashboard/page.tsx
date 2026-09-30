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
      <nav className="border-b border-white/10 px-8 py-6 flex items-center justify-between bg-[#0a0a0a]">
        <a href="/" className="font-serif text-2xl font-bold tracking-widest uppercase">
          TripKeeper
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
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Welcome hero */}
        <div className="mb-20">
          <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-wide">
            Welcome to your journey
          </h1>
          <p className="mt-6 text-gray-400 font-light text-lg max-w-xl mx-auto">
            Your upcoming travels, saved destinations, and curated itineraries await.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Places", desc: "Curate your favourite spots", href: "/places" },
            { label: "Trips", desc: "Plan detailed itineraries", href: "/trips" },
            { label: "AI Planner", desc: "Generate intelligent routes", href: "/ai-planner" },
          ].map(({ label, desc, href }) => (
            <a
              key={label}
              href={href}
              className="group flex flex-col items-center justify-center gap-4 p-12 bg-[#0f0f0f] border border-white/5
                         rounded-2xl hover:border-[#e87a5d]/50 hover:bg-[#141414] transition-all duration-300"
            >
              <h2 className="text-2xl font-serif tracking-wide">{label}</h2>
              <p className="text-sm text-gray-500 text-center font-light">{desc}</p>
              <div className="mt-6 w-8 h-[1px] bg-gray-700 group-hover:bg-[#e87a5d] group-hover:w-12 transition-all duration-300"></div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
