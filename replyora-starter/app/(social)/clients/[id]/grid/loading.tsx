/** Grid-shaped skeleton: the 3-column feed mock so the swap reads as the page
 *  resolving, not a generic block flashing. */
export default function GridLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-3 w-40 rounded bg-oat" />
        <div className="h-9 w-28 rounded-full bg-oat/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,360px)_1fr]">
        {/* left controls */}
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-oat" />
          <div className="h-8 w-full rounded-lg bg-oat/60" />
          <div className="h-24 w-full rounded-xl bg-oat/40" />
          <div className="h-10 w-full rounded-lg bg-oat/50" />
        </div>
        {/* phone mock: 3-col tile grid */}
        <div className="rounded-3xl border border-oat bg-white p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-oat/70" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-oat/70" />
              <div className="h-3 w-16 rounded bg-oat/40" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-oat/50" />
            ))}
          </div>
        </div>
        {/* right rail */}
        <div className="space-y-3">
          <div className="h-11 w-full rounded-xl bg-oat/60" />
          <div className="h-32 w-full rounded-2xl bg-oat/40" />
          <div className="h-20 w-full rounded-2xl bg-oat/30" />
        </div>
      </div>
    </div>
  );
}
