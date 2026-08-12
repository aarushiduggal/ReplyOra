import { NextResponse } from "next/server";

import { fetchLiveInstagramFeed } from "@/lib/social/instagram-feed";

export const runtime = "nodejs";

/**
 * The client's live Instagram feed, loaded AFTER the Grid shell renders so a
 * slow Graph API never blocks the page. fetchLiveInstagramFeed is workspace-
 * scoped (via the session), so a foreign client id just returns not-connected.
 */
export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("client");
  const empty = { connected: false, username: null, profile: null, media: [] };
  if (!clientId) return NextResponse.json(empty);
  const feed = await fetchLiveInstagramFeed(clientId).catch(() => empty);
  return NextResponse.json(feed ?? empty);
}
