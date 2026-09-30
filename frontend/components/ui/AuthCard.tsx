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
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a] bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block font-serif text-3xl font-bold text-white tracking-widest uppercase mb-6">
            TripKeeper
          </a>
          <h1 className="text-3xl font-serif text-white font-medium">{title}</h1>
          <p className="mt-3 text-gray-400 font-light text-sm tracking-wide">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
