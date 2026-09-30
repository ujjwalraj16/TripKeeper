"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
      <div className="text-6xl mb-6">💥</div>
      <h2 className="text-3xl font-bold mb-4 text-red-400">Something went wrong!</h2>
      <p className="text-gray-400 max-w-md text-center mb-8">
        We encountered an unexpected error. The TripKeeper development monkeys have been dispatched to investigate.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors border border-gray-700"
        >
          Try again
        </button>
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
