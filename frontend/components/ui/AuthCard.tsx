/**
 * components/ui/AuthCard.tsx — Shared card wrapper used by /login and /register.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      {/* Glowing background blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white">
            <span>🗺️</span> TripKeeper
          </a>
          <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-gray-400 text-sm">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
