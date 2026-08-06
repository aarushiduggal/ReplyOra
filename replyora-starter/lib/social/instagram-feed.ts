import "server-only";

import { listClientConnections } from "@/lib/social/connections";

/**
 * Live Instagram feed for the Grid. Reads the client's connected IG Business
 * account (via the Meta Graph API using the stored page token) so the grid can
 * mirror what's actually live on their profile.
 *
 * Returns [] when the client hasn't connected Instagram, Meta isn't configured,
 * or the Graph call fails — the grid then falls back to the planned tiles.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export interface LiveMedia {
  id: string;
  mediaUrl: string; // image (or video thumbnail) to render on the grid
  permalink: string | null;
  caption: string | null;
  mediaType: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  timestamp: string | null;
}

export interface LiveFeed {
  connected: boolean;
  username: string | null;
  media: LiveMedia[];
}

interface GraphMedia {
  id: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  media_type?: string;
  timestamp?: string;
}

export async function fetchLiveInstagramFeed(
  clientId: string,
  limit = 12,
): Promise<LiveFeed> {
  const empty: LiveFeed = { connected: false, username: null, media: [] };

  let conns;
  try {
    conns = await listClientConnections(clientId);
  } catch {
    return empty;
  }
  const ig = conns.find((c) => c.platform === "instagram");
  if (!ig?.accessToken || !ig.externalAccountId) return empty;

  try {
    const url =
      `${GRAPH}/${ig.externalAccountId}/media` +
      `?fields=id,media_url,thumbnail_url,permalink,caption,media_type,timestamp` +
      `&limit=${limit}&access_token=${ig.accessToken}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) return { connected: true, username: ig.externalUsername, media: [] };
    const data = (await res.json()) as { data?: GraphMedia[] };

    const media: LiveMedia[] = (data.data ?? [])
      .map((m) => {
        const mediaUrl =
          m.media_type === "VIDEO" ? m.thumbnail_url ?? m.media_url : m.media_url;
        if (!mediaUrl) return null;
        return {
          id: m.id,
          mediaUrl,
          permalink: m.permalink ?? null,
          caption: m.caption ?? null,
          mediaType: m.media_type ?? "IMAGE",
          timestamp: m.timestamp ?? null,
        };
      })
      .filter((m): m is LiveMedia => m !== null);

    return { connected: true, username: ig.externalUsername, media };
  } catch {
    return { connected: true, username: ig.externalUsername, media: [] };
  }
}
