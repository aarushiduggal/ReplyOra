import { IntegrationsWorkspace } from "@/components/social/integrations/integrations-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientConnections } from "@/lib/social/connections";
import { HAS_META, HAS_TIKTOK, HAS_AYRSHARE } from "@/lib/social/publish";

export const dynamic = "force-dynamic";

export default async function ClientIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, connections] = await Promise.all([
    getClient(id),
    listClientConnections(id),
  ]);
  const name = client?.name ?? sampleName(id);

  // A platform is "connected" if it has a stored OAuth token (real) or the
  // legacy stub flag on the client.
  const connected = Array.from(
    new Set([
      ...(client?.platforms ?? []),
      ...connections.map((c) => c.platform),
    ]),
  );

  return (
    <IntegrationsWorkspace
      clientId={id}
      clientName={name}
      platforms={connected}
      metaReady={HAS_META}
      tiktokReady={HAS_TIKTOK}
      ayrshareReady={HAS_AYRSHARE}
    />
  );
}
