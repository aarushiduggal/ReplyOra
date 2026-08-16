/** Calendar-shaped skeleton: a month grid frame so the swap reads as the
 *  calendar resolving rather than a generic block. */
export default function CalendarLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-3 w-40 rounded bg-oat" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-lg bg-oat/60" />
          <div className="h-9 w-28 rounded-lg bg-oat/70" />
          <div className="h-9 w-9 rounded-lg bg-oat/60" />
        </div>
      </div>
      <div className="rounded-2xl border border-oat bg-white p-4">
        <div className="mb-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-10 rounded bg-oat/50" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-oat/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
