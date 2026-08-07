import { ReportsWorkspace } from "@/components/social/reports/reports-workspace";
import { LockedSection } from "@/components/social/locked-section";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { entitlementsFor } from "@/lib/social/plans";
import { fetchInstagramInsights } from "@/lib/social/instagram-insights";

export const dynamic = "force-dynamic";

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, posts, billing, insights] = await Promise.all([
    getClient(id),
    listClientPosts(id),
    getWorkspaceBilling(),
    // Real Meta Insights (reach/engagement) — exercises manage_insights and
    // powers the "at a glance" numbers. null when IG isn't connected.
    fetchInstagramInsights(id).catch(() => null),
  ]);
  const name = client?.name ?? sampleName(id);

  // Plan gate: client-facing reports are a paid add-on.
  const ent = entitlementsFor(billing.accountType, billing.addons);
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
