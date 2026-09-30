"use client";
import React from "react";
import Link from "next/link";

// Real Unsplash IDs for authentic travel photography
const basePhotos = [
  { id: "1476514525535-07fb3b4ae5f1", span: "col-span-2 row-span-2" }, // Landscape
  { id: "1499856871958-5b9627545d1a", span: "col-span-1 row-span-2" }, // Paris Architecture
  { id: "1506929562872-bb421503ef21", span: "col-span-2 row-span-1" }, // Beach
  { id: "1502899576159-f224dc2349fa", span: "col-span-1 row-span-1" }, // City street
  { id: "1469854523086-cc02fe5d8800", span: "col-span-1 row-span-2" }, // Road trip
  { id: "1448375240586-882707db888b", span: "col-span-2 row-span-1" }, // Forest
  { id: "1533050487297-09b450131906", span: "col-span-1 row-span-1" }, // Coastal town
  { id: "1518684079-3c830dcef090", span: "col-span-1 row-span-1" }, // Culture
  { id: "1504674900247-0877df9cc836", span: "col-span-1 row-span-1" }, // Food
  { id: "1522202176988-66273c2fd55f", span: "col-span-2 row-span-2" }, // Travelers
  { id: "1464822759023-fed622ff2c3b", span: "col-span-2 row-span-1" }, // Mountain
  { id: "1523906834658-6e24ef2386f9", span: "col-span-1 row-span-2" }, // Venice
  { id: "1530789253388-582c481c54b0", span: "col-span-2 row-span-1" }, // Train
  { id: "1473625247510-8ceb1760e43f", span: "col-span-1 row-span-1" }, // Road
  { id: "1501504905252-473c47e087f8", span: "col-span-1 row-span-1" }, // Coffee
  { id: "1513635269975-59663e0ac1ad", span: "col-span-2 row-span-2" }, // London
  { id: "1503899036084-c55cdd94daa1", span: "col-span-2 row-span-1" }, // Japan
  { id: "1534008897995-27a23e859048", span: "col-span-1 row-span-2" }, // Nature
];

// Duplicate to create a seamless infinite scroll
const photos = [...basePhotos, ...basePhotos];

export default function HomePage() {
  return (
    <main className="relative h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      
      {/* ── INLINE STYLES FOR ANIMATION ── */}
      <style>{`
        @keyframes scrollMosaic {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-mosaic {
          animation: scrollMosaic 60s linear infinite;
        }
      `}</style>

      {/* ── BACKGROUND MOSAIC ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center">
        {/* The grid animates upwards infinitely */}
        <div className="w-[110vw] grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-[220px] gap-4 p-4 opacity-40 animate-scroll-mosaic mt-[-5vh]">
          {photos.map((photo, i) => (
            <div 
              key={i} 
              className={`relative rounded-xl overflow-hidden shadow-2xl ${photo.span}`}
            >
              <img 
                src={`https://images.unsplash.com/photo-${photo.id}?q=80&w=1200&auto=format&fit=crop`}
                alt="Travel Photography"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* Dark cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/40 to-[#0a0a0a]/90 backdrop-blur-[1px]" />
      </div>

      {/* ── CONTENT LAYER ── */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* Navigation */}
        <nav className="w-full px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-wide font-bold">TripKeeper</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm tracking-wide text-gray-300">
            <Link href="#" className="hover:text-white transition-colors">Discover</Link>
            <Link href="/trips" className="hover:text-white transition-colors">My Trips</Link>
            <Link href="#" className="hover:text-white transition-colors">Explore</Link>
            <Link href="#" className="hover:text-white transition-colors">Memories</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:text-gray-300 transition-colors">Sign In</Link>
            <Link href="/register" className="text-sm font-medium px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-all">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6 drop-shadow-2xl text-[#faf9f6]">
            TRIPKEEPER
          </h1>
          <p className="font-sans text-xl md:text-2xl text-gray-300 tracking-wide font-light max-w-2xl mb-12 drop-shadow-md">
            Plan the journey. Keep the memories.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Link 
              href="/register"
              className="px-8 py-4 bg-[#e87a5d] hover:bg-[#d66b4f] text-white rounded-full font-medium tracking-wide transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(232,122,93,0.3)]"
            >
              Plan a Trip →
            </Link>
            <Link 
              href="/trips"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-full font-medium tracking-wide transition-all"
            >
              Explore Trips
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
