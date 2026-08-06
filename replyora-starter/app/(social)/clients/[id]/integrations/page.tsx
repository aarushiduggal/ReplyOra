import { IntegrationsWorkspace } from "@/components/social/integrations/integrations-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientConnections } from "@/lib/social/connections";
import { HAS_META, HAS_TIKTOK, HAS_POSTPEER } from "@/lib/social/publish";
import { syncClientConnections } from "@/lib/social/postpeer";

export const dynamic = "force-dynamic";

export default async function ClientIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // In PostPeer mode, mirror the client's own connected accounts back from
  // PostPeer first, so a just-authorised account shows up immediately.
  if (HAS_POSTPEER) {
    try {
      await syncClientConnections(id);
    } catch {
      /* leave existing connections as-is on any sync hiccup */
    }
  }

  const [client, connections] = await Promise.all([
    getClient(id),
    listClientConnections(id),
  ]);
  const name = client?.name ?? sampleName(id);

  // A platform is "connected" if it has a stored account (real) or the legacy
  // stub flag on the client.
  const connected = Array.from(
    new Set([
      ...(client?.platforms ?? []),
      ...connections.map((c) => c.platform),
    ]),
  );

  // Per-platform account id + the connected handle (shown on each card).
  const linkedAccounts: Record<string, string> = {};
  const linkedHandles: Record<string, string> = {};
  for (const c of connections) {
    if (c.externalAccountId) linkedAccounts[c.platform] = c.externalAccountId;
    if (c.externalUsername) linkedHandles[c.platform] = c.externalUsername;
  }

  return (
    <IntegrationsWorkspace
      clientId={id}
      clientName={name}
      platforms={connected}
      metaReady={HAS_META}
      tiktokReady={HAS_TIKTOK}
      postpeerReady={HAS_POSTPEER}
      linkedAccounts={linkedAccounts}
      linkedHandles={linkedHandles}
    />
  );
}
