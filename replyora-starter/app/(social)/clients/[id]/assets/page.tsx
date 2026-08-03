import { AssetsWorkspace } from "@/components/social/assets/assets-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientAssets } from "@/lib/social/assets";
import { hasStorage } from "@/lib/social/storage";

export const dynamic = "force-dynamic";

export default async function ClientAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, assets] = await Promise.all([
    getClient(id),
    listClientAssets(id),
  ]);
  const name = client?.name ?? sampleName(id);

  return (
    <AssetsWorkspace
      clientId={id}
      clientName={name}
      assets={assets}
      storageReady={hasStorage()}
    />
  );
}
