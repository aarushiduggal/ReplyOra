import { StudioWorkspace } from "@/components/social/studio/studio-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientAssets } from "@/lib/social/assets";
import { getWorkspaceBilling } from "@/lib/social/billing";

export const dynamic = "force-dynamic";

export default async function ClientStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, assets, billing] = await Promise.all([
    getClient(id),
    listClientAssets(id),
    getWorkspaceBilling(),
  ]);
  const name = client?.name ?? sampleName(id);

  return (
    <StudioWorkspace
      clientId={id}
      clientName={name}
      businessName={billing.businessName}
      assets={assets}
    />
  );
}
