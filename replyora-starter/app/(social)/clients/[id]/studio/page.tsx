import { notFound } from "next/navigation";
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
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
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
