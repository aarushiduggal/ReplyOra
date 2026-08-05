import { getBroadcasts } from "@/lib/admin/data";
import { getAdminOverview } from "@/lib/admin/overview";
import {
  BroadcastComposer,
  type BroadcastAudience,
} from "@/components/admin/broadcast-composer";

export const dynamic = "force-dynamic";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBroadcastPage() {
  const [{ agencies, kpis }, broadcasts] = await Promise.all([
    getAdminOverview(),
    Promise.resolve(getBroadcasts()),
  ]);

  const audiences: BroadcastAudience[] = [
    { key: "all", label: "All agencies", count: kpis.agencies },
    { key: "agency", label: "Agency plan", count: agencies.filter((a) => a.accountType === "agency").length },
    { key: "personal", label: "Personal plan", count: agencies.filter((a) => a.accountType === "personal").length },
    { key: "trialing", label: "Trials", count: kpis.trialing },
    { key: "past_due", label: "Past-due", count: kpis.pastDue },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-oxblood/70">Broadcast</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Reach your agencies</h1>
        <p className="mt-1 text-sm text-ink/60">
          Announce new features, tips or maintenance — to everyone, or just a segment.
        </p>
      </div>

      <BroadcastComposer audiences={audiences} />

      <div>
        <h2 className="mb-3 font-semibold text-ink">Sent</h2>
        <div className="space-y-2">
          {broadcasts.map((b) => (
            <div key={b.id} className="rounded-2xl border border-oxblood/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{b.subject}</p>
                <span className="text-xs text-ink/40">{when(b.sentAt)}</span>
              </div>
              <p className="mt-1 text-sm text-ink/60">{b.body}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-oxblood/70">{b.audience}</p>
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
