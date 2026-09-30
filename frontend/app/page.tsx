/**
 * app/page.tsx — Landing / home page
 * Shown before the user logs in. Links to /login and /register.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Hero */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-5xl">🗺️</span>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          TripKeeper
        </h1>
      </div>

      <p className="max-w-xl text-lg text-gray-400 mb-10">
        Plan day-by-day itineraries, discover places on an interactive map, and
        let AI optimise your routes — all in one place.
      </p>

      {/* CTA buttons */}
      <div className="flex gap-4">
        <a
          id="btn-get-started"
          href="/register"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors"
        >
          Get Started
        </a>
        <a
          id="btn-login"
          href="/login"
          className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 font-semibold transition-colors"
        >
          Log In
        </a>
      </div>

      {/* Feature pills */}
      <div className="mt-14 flex flex-wrap justify-center gap-3 text-sm text-gray-500">
        {[
          "📍 Save Places",
          "🗓️ Day-wise Itineraries",
          "🤝 Collaborate",
          "🤖 AI Planning",
          "🗺️ OpenStreetMap",
        ].map((f) => (
          <span
            key={f}
            className="px-4 py-2 rounded-full bg-gray-800 border border-gray-700"
          >
            {f}
          </span>
        ))}
      </div>
    </main>
  );
}
