import { listWaitlist } from "@/lib/waitlist";
import { WaitlistTable, type WaitlistRow } from "@/components/admin/waitlist-table";

export default async function AdminWaitlistPage() {
  const signups = await listWaitlist();
  const rows: WaitlistRow[] = signups.map((s) => ({
    id: s.id,
    email: s.email,
    feature: s.feature,
    source: s.source,
    createdAt: s.createdAt,
  }));

  const voiceCount = rows.filter((r) => r.feature === "voice").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Waitlist</h1>
        <p className="mt-1 text-sm text-ink/60">
          People who asked to be notified about upcoming features. {rows.length}{" "}
          total
          {voiceCount > 0 ? ` · ${voiceCount} for voice` : ""}. Demand signal
          before we build.
        </p>
      </div>
      <WaitlistTable rows={rows} />
    </div>
  );
}
