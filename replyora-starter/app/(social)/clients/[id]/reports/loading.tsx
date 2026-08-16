/** Reports-shaped skeleton: stat cards + a chart block, matching the real
 *  performance layout so it resolves in place. */
export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-3 w-44 rounded bg-oat" />
        <div className="h-9 w-32 rounded-full bg-oat/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-oat bg-white p-4">
            <div className="h-3 w-20 rounded bg-oat/60" />
            <div className="mt-3 h-7 w-24 rounded bg-oat/70" />
            <div className="mt-2 h-2.5 w-16 rounded bg-oat/40" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-oat bg-white p-5">
        <div className="h-3 w-32 rounded bg-oat/60" />
        <div className="mt-4 h-48 w-full rounded-xl bg-oat/30" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-oat bg-white p-4">
            <div className="aspect-square w-full rounded-xl bg-oat/40" />
            <div className="mt-3 h-3 w-2/3 rounded bg-oat/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
