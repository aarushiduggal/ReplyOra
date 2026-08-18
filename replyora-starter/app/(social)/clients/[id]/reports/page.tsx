import { notFound } from "next/navigation";
import { ReportsWorkspace } from "@/components/social/reports/reports-workspace";
import { LockedSection } from "@/components/social/locked-section";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { currentEntitlements } from "@/lib/social/billing";
import { fetchInstagramInsights } from "@/lib/social/instagram-insights";

export const dynamic = "force-dynamic";

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Gate FIRST (one billing read, reused below) — locked users must never pay
  // the slow IG-insights round-trip just to see an upsell screen.
  const { ent, billing } = await currentEntitlements();
  if (!ent.reports) {
    return (
      <LockedSection
        title="Reports are on Studio & Agency"
        description="Upgrade to Studio to send clients a polished monthly performance summary of reach, engagement and growth — with PDF export."
        addonLabel="Studio plan"
        priceLabel="from $79/mo AUD"
      />
    );
  }

  const [client, posts, insights] = await Promise.all([
    getClient(id),
    listClientPosts(id),
    // Real Meta Insights (reach/engagement) — null when IG isn't connected.
    // Capped at 4s so a slow Graph API can't hang the Reports page; the
    // workspace degrades gracefully to the not-connected state on null.
    Promise.race([
      fetchInstagramInsights(id).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]),
  ]);
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
  const name = client?.name ?? sampleName(id);
  const connected = (client?.platforms ?? []).includes("instagram");

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <ReportsWorkspace
      clientId={id}
      clientName={name}
      connected={connected}
      posts={posts}
      insights={insights}
      reportTitle={billing.reportTitle || "Performance Analytics"}
      todayISO={todayISO}
    />
  );
}
