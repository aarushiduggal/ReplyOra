import { GridWorkspace } from "@/components/social/grid/grid-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { getProfilePreview, listClientTiles } from "@/lib/social/grid";
import { listClientAssets } from "@/lib/social/assets";
import { listClientConnections } from "@/lib/social/connections";
export const dynamic = "force-dynamic";

export default async function ClientGridPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const EMPTY_PROFILE = {
    username: "",
    displayName: "",
    followers: "0",
    following: "0",
    bio: "",
    website: "",
  };
  // Every fetch is fault-tolerant: a single failing call (a flaky Graph request,
  // a missing row) must never crash the whole Grid page.
  const [client, tiles, profile, assets, connections] = await Promise.all([
    getClient(id).catch(() => null),
    listClientTiles(id).catch(() => []),
    getProfilePreview(id).catch(() => ({ ...EMPTY_PROFILE })),
    listClientAssets(id).catch(() => []),
    listClientConnections(id).catch(() => []),
  ]);
  const name = client?.name ?? sampleName(id);

  // The live IG feed + colour analysis are loaded client-side after the shell
  // renders (GridWorkspace → /api/social/live-feed), so a slow Graph API never
  // blocks the page. Start from not-connected.
  const liveFeed = { connected: false, username: null, profile: null, media: [] };

  // A platform counts as connected if it has a stored connection or the flag.
  const connectedPlatforms = Array.from(
    new Set([
      ...(client?.platforms ?? []),
      ...connections.map((c) => c.platform),
    ]),
  );

  return (
    <GridWorkspace
      clientId={id}
      clientName={name}
      tiles={tiles}
      profile={profile}
      assets={assets.filter((a) => a.kind === "image").map((a) => ({ id: a.id, url: a.url }))}
      connectedPlatforms={connectedPlatforms}
      liveFeed={liveFeed}
      feedAnalysis={null}
    />
  );
}
