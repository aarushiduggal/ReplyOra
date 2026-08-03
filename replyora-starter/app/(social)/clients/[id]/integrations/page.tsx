import { IntegrationsWorkspace } from "@/components/social/integrations/integrations-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";

export const dynamic = "force-dynamic";

export default async function ClientIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  const name = client?.name ?? sampleName(id);

  return (
    <IntegrationsWorkspace
      clientId={id}
      clientName={name}
      platforms={client?.platforms ?? []}
    />
  );
}
