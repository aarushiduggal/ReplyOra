/**
 * Instant skeleton shown the moment you tap a client tab, while the server
 * renders the real page. The tab nav (in layout.tsx) stays put, so navigation
 * feels immediate instead of frozen.
 */
export default function ClientTabLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-3 w-24 rounded bg-oat" />
        <div className="h-3 w-40 rounded bg-oat/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-oat" />
          <div className="h-10 w-full rounded-xl bg-oat/70" />
          <div className="h-10 w-full rounded-xl bg-oat/50" />
          <div className="h-10 w-2/3 rounded-xl bg-oat/40" />
        </div>
        <div className="space-y-3">
          <div className="h-40 w-full rounded-2xl bg-oat/60" />
          <div className="h-24 w-full rounded-2xl bg-oat/40" />
          <div className="h-24 w-full rounded-2xl bg-oat/30" />
        </div>
      </div>
    </div>
  );
}
