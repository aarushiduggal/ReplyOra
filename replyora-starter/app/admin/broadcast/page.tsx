import { getBroadcasts } from "@/lib/admin/data";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBroadcastPage() {
  const broadcasts = getBroadcasts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Broadcast</h1>
        <p className="mt-1 text-sm text-ink/60">
          Send an announcement to every client — new features, maintenance,
          tips.
        </p>
      </div>

      <BroadcastComposer />

      <div>
        <h2 className="mb-3 font-semibold text-ink">Sent</h2>
        <div className="space-y-2">
          {broadcasts.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{b.subject}</p>
                <span className="text-xs text-ink/40">{when(b.sentAt)}</span>
              </div>
              <p className="mt-1 text-sm text-ink/60">{b.body}</p>
              <p className="mt-1 text-xs text-ink/40">{b.audience}</p>
            </div>
          ))}
          {broadcasts.length === 0 && (
            <p className="text-sm text-ink/50">No announcements sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
