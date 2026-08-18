import { notFound } from "next/navigation";
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
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
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
