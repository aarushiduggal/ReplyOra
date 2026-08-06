import "server-only";

import { listClientConnections } from "@/lib/social/connections";
import { HAS_INSTAGRAM_LOGIN } from "@/lib/social/publish";

/**
 * Live Instagram feed for the Grid. Reads the client's connected IG Business
 * account (via the Meta Graph API using the stored page token) so the grid can
 * mirror what's actually live on their profile.
 *
 * Returns [] when the client hasn't connected Instagram, Meta isn't configured,
 * or the Graph call fails — the grid then falls back to the planned tiles.
 */

// Instagram-Login tokens read via graph.instagram.com; Facebook-Login page
// tokens via graph.facebook.com. Same /{user-id}/media endpoint on both.
const GRAPH = HAS_INSTAGRAM_LOGIN
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";

export interface LiveMedia {
  id: string;
  mediaUrl: string; // image (or video thumbnail) to render on the grid
  permalink: string | null;
  caption: string | null;
  mediaType: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  timestamp: string | null;
}

export interface LiveProfile {
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  postsCount: number;
  avatarUrl: string | null;
}

export interface LiveFeed {
  connected: boolean;
  username: string | null;
  profile: LiveProfile | null;
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
  const empty: LiveFeed = { connected: false, username: null, profile: null, media: [] };

  let conns;
  try {
    conns = await listClientConnections(clientId);
  } catch {
    return empty;
  }
  const ig = conns.find((c) => c.platform === "instagram");
  if (!ig?.accessToken || !ig.externalAccountId) return empty;

  // Real profile stats (followers / following / posts / avatar) for the mock.
  const target = HAS_INSTAGRAM_LOGIN ? "me" : ig.externalAccountId;
  let profile: LiveProfile | null = null;
  try {
    const pRes = await fetch(
      `${GRAPH}/${target}?fields=username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${ig.accessToken}`,
      { next: { revalidate: 300 } },
    );
    if (pRes.ok) {
      const p = (await pRes.json()) as {
        name?: string; biography?: string; followers_count?: number;
        follows_count?: number; media_count?: number; profile_picture_url?: string;
      };
      profile = {
        name: p.name ?? null,
        bio: p.biography ?? null,
        followers: p.followers_count ?? 0,
        following: p.follows_count ?? 0,
        postsCount: p.media_count ?? 0,
        avatarUrl: p.profile_picture_url ?? null,
      };
    }
  } catch {
    /* profile is optional */
  }

  try {
    const url =
      `${GRAPH}/${target}/media` +
      `?fields=id,media_url,thumbnail_url,permalink,caption,media_type,timestamp` +
      `&limit=${limit}&access_token=${ig.accessToken}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) return { connected: true, username: ig.externalUsername, profile, media: [] };
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

    return { connected: true, username: ig.externalUsername, profile, media };
  } catch {
    return { connected: true, username: ig.externalUsername, profile, media: [] };
  }
}
