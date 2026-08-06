import { GridWorkspace } from "@/components/social/grid/grid-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { getProfilePreview, listClientTiles } from "@/lib/social/grid";
import { listClientAssets } from "@/lib/social/assets";
import { listClientConnections } from "@/lib/social/connections";
import { fetchLiveInstagramFeed } from "@/lib/social/instagram-feed";
import { analyzeLiveFeed } from "@/lib/social/feed-analysis";

export const dynamic = "force-dynamic";

export default async function ClientGridPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, tiles, profile, assets, connections, liveFeed] = await Promise.all([
    getClient(id),
    listClientTiles(id),
    getProfilePreview(id),
    listClientAssets(id).catch(() => []),
    listClientConnections(id).catch(() => []),
    fetchLiveInstagramFeed(id).catch(() => ({ connected: false, username: null, profile: null, media: [] })),
  ]);
  const name = client?.name ?? sampleName(id);

  // Live grid intelligence: analyse the real feed's colours + how the planned
  // (unpublished) tiles would shift its harmony. Null when IG isn't connected.
  const plannedMediaUrls = tiles
    .filter((t) => t.status !== "published" && t.mediaUrl)
    .map((t) => t.mediaUrl as string);
  const feedAnalysis = await analyzeLiveFeed(id, plannedMediaUrls).catch(() => null);

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
      feedAnalysis={feedAnalysis}
    />
  );
}
