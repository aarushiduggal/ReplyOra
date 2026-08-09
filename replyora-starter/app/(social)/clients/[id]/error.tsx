"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Error boundary for a client's pages (grid, calendar, etc.). A single flaky
 * request (e.g. a Graph API hiccup) should never leave the user on a raw crash
 * screen — show a calm retry instead.
 */
export default function ClientSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console + server logs for debugging.
    console.error("Client section error:", error);
  }, [error]);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-oxblood/15 bg-white p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
        <RefreshCw className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-2xl text-oxblood">Something hiccuped</h2>
      <p className="mt-2 text-sm text-ink/70">
        This page hit a snag loading — usually a momentary connection issue. Give it
        another go.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-oxblood px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
