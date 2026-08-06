/** Instant skeleton for top-level dashboard navigation (clients, tasks, etc.). */
export default function SocialLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-48 rounded bg-oat" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-oat/50" />
        ))}
      </div>
    </div>
  );
}
