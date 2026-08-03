import { GridWorkspace } from "@/components/social/grid/grid-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { getProfilePreview, listClientTiles } from "@/lib/social/grid";

export const dynamic = "force-dynamic";

export default async function ClientGridPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, tiles, profile] = await Promise.all([
    getClient(id),
    listClientTiles(id),
    getProfilePreview(id),
  ]);
  const name = client?.name ?? sampleName(id);

  return (
    <GridWorkspace
      clientId={id}
      clientName={name}
      tiles={tiles}
      profile={profile}
    />
  );
}
