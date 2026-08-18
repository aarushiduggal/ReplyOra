import { notFound } from "next/navigation";
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
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
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
