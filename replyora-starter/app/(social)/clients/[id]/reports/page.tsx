import { ReportsWorkspace } from "@/components/social/reports/reports-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { getWorkspaceBilling } from "@/lib/social/billing";

export const dynamic = "force-dynamic";

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, posts, billing] = await Promise.all([
    getClient(id),
    listClientPosts(id),
    getWorkspaceBilling(),
  ]);
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
      reportTitle={billing.reportTitle || "Performance Analytics"}
      todayISO={todayISO}
    />
  );
}
