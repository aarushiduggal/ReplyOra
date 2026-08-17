/**
 * Instant skeleton for staff-portal navigation. Every /admin page is
 * force-dynamic, so without this a click sat on the previous screen with no
 * feedback until Neon answered — which is what made the portal feel laggy.
 * Mirrors the dark staff chrome rather than the porcelain client skeleton.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-ink/10" />
        <div className="h-8 w-72 rounded bg-ink/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-ink/5" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
