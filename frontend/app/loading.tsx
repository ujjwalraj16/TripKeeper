export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
