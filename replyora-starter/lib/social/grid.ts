import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { DEMO_CLIENT_ID, DEMO_PROFILE, demoTiles } from "@/lib/social/demo";
import type { Platform } from "@/lib/social/types";

/**
 * ReplyOra Social — Grid data layer (client-scoped).
 *
 * Reads/writes the Instagram-style planner for one client:
 *   • social_posts (+ client_id, + order_index) — the feed tiles
 *   • profile_preview — the iPhone mock's username/bio/counts
 *
 * DATABASE_URL set → Neon; unset → in-memory (local dev). Every call is scoped
 * by the agency workspace_id (from the session) AND the client_id.
 * Schema: db/migrations/0003_agency_clients.sql
 */

export type TileStatus = "draft" | "scheduled" | "published";

export interface GridTile {
  id: string;
  caption: string;
  status: TileStatus;
  platform: Platform;
  pillar: string;
  orderIndex: number;
  /** Placed image (Instagram media). null until an asset is dropped on the tile. */
  mediaUrl: string | null;
  /** ISO datetime this post is scheduled to publish (null unless scheduled). */
  scheduledFor: string | null;
  /** Why the last publish attempt failed. Null when it hasn't failed. */
  publishError: string | null;
  /** "video" marks a Reel or a TikTok clip; the tile shows a play badge. */
  mediaKind: "image" | "video" | null;
  /** Slides on this post. >1 means a carousel, and the tile shows the count. */
  mediaCount: number;
}

export interface ProfilePreview {
  username: string;
  displayName: string;
  followers: string;
  following: string;
  bio: string;
  website: string;
}

const EMPTY_PROFILE: ProfilePreview = {
  username: "",
  displayName: "",
  followers: "0",
  following: "0",
  bio: "",
  website: "",
};

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

// ---- In-memory fallback (local dev) --------------------------------------
const MEM_PROFILE = new Map<string, ProfilePreview>(); // key: `${ws}:${client}`

// ---- Posts ---------------------------------------------------------------

interface TileRow {
  id: string;
  caption: string | null;
  status: string;
  platform: string | null;
  pillar: string | null;
  order_index: number | null;
  media_url: string | null;
  scheduled_for: string | Date | null;
  publish_error?: string | null;
  media_kind?: string | null;
  media_count?: number | null;
}

export async function listClientTiles(clientId: string): Promise<GridTile[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return clientId === DEMO_CLIENT_ID ? demoTiles() : [];
  const rows = (await sql()`
    SELECT p.id, p.caption, p.status, p.platform, p.pillar, p.order_index,
           p.media_url, p.scheduled_for, p.publish_error, p.media_kind,
           -- A tile needs to show "carousel of 4" without a second round trip
           -- per tile, so the count is aggregated here.
           COALESCE((SELECT count(*) FROM post_media m WHERE m.post_id = p.id), 0)::int
             AS media_count
    FROM social_posts p
    WHERE p.workspace_id = ${workspaceId} AND p.client_id = ${clientId}
    ORDER BY p.order_index ASC NULLS LAST, p.created_at DESC
  `) as TileRow[];
  return rows.map((r, i) => ({
    id: r.id,
    caption: r.caption ?? "",
    status: (r.status as TileStatus) ?? "draft",
    platform: (r.platform as Platform) ?? "instagram",
    pillar: r.pillar ?? "",
    orderIndex: r.order_index ?? i,
    mediaUrl: r.media_url ?? null,
    scheduledFor: r.scheduled_for ? new Date(r.scheduled_for).toISOString() : null,
    publishError: r.publish_error ?? null,
    mediaKind: r.media_kind === "video" ? "video" : r.media_kind ? "image" : null,
    // Older posts predate post_media; a post that has a media_url but no rows
    // still counts as one piece of media, not zero.
    mediaCount: r.media_count ?? (r.media_url ? 1 : 0),
  }));
}

/** Place an image on a tile (drag an asset onto the grid slot). */
export async function setTileMedia(
  clientId: string,
  tileId: string,
  mediaUrl: string | null,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  await sql()`
    UPDATE social_posts SET media_url = ${mediaUrl}
    WHERE workspace_id = ${workspaceId}
      AND client_id = ${clientId}
      AND id = ${tileId}
  `;
}

/** Bulk-update the status of several tiles at once (multi-select actions). */
export async function bulkSetTileStatus(
  clientId: string,
  ids: string[],
  status: TileStatus,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb() || ids.length === 0) return;
  await sql()`
    UPDATE social_posts SET status = ${status}
    WHERE workspace_id = ${workspaceId}
      AND client_id = ${clientId}
      AND id = ANY(${ids})
  `;
}

/** Schedule several tiles for a real date/time (moves them to the calendar). */
export async function scheduleTiles(
  clientId: string,
  ids: string[],
  scheduledForIso: string,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb() || ids.length === 0) return;
  await sql()`
    UPDATE social_posts
       SET status = 'scheduled', scheduled_for = ${scheduledForIso}
     WHERE workspace_id = ${workspaceId}
       AND client_id = ${clientId}
       AND id = ANY(${ids})
  `;
}

/** Remove a post from the schedule — back to draft, clears its scheduled time. */
export async function unscheduleTile(
  clientId: string,
  id: string,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  await sql()`
    UPDATE social_posts SET status = 'draft', scheduled_for = NULL
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId} AND id = ${id}
  `;
}

/** Bulk-delete several tiles at once (multi-select actions). */
export async function bulkDeleteTiles(
  clientId: string,
  ids: string[],
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb() || ids.length === 0) return;
  await sql()`
    DELETE FROM social_posts
    WHERE workspace_id = ${workspaceId}
      AND client_id = ${clientId}
      AND id = ANY(${ids})
  `;
}

/** Persist the feed order — writes order_index in the given id sequence. */
export async function reorderClientTiles(
  clientId: string,
  orderedIds: string[],
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb() || orderedIds.length === 0) return;
  // One set-based write instead of one round-trip per tile: unnest the ordered
  // ids with their position and join back by id. `ord` is 1-based → order_index
  // is `ord - 1` to preserve the previous 0-based sequence.
  await sql()`
    UPDATE social_posts AS p
       SET order_index = v.ord - 1
      FROM unnest(${orderedIds}::text[]) WITH ORDINALITY AS v(id, ord)
     WHERE p.workspace_id = ${workspaceId}
       AND p.client_id = ${clientId}
       AND p.id = v.id
  `;
}

// ---- Profile preview -----------------------------------------------------

interface ProfileRow {
  username: string | null;
  display_name: string | null;
  followers: string | null;
  following: string | null;
  bio: string | null;
  website: string | null;
}

export async function getProfilePreview(
  clientId: string,
): Promise<ProfilePreview> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const saved = MEM_PROFILE.get(`${workspaceId}:${clientId}`);
    if (saved) return saved;
    return clientId === DEMO_CLIENT_ID ? { ...DEMO_PROFILE } : { ...EMPTY_PROFILE };
  }
  // Scope to this workspace by joining clients — profile_preview has no
  // workspace_id column, so an unscoped read would leak another tenant's
  // profile (username/bio/followers) for a known client id.
  const rows = (await sql()`
    SELECT pp.username, pp.display_name, pp.followers, pp.following, pp.bio, pp.website
    FROM profile_preview pp
    JOIN clients c ON c.id = pp.client_id AND c.workspace_id = ${workspaceId}
    WHERE pp.client_id = ${clientId}
    LIMIT 1
  `) as ProfileRow[];
  const r = rows[0];
  if (!r) return { ...EMPTY_PROFILE };
  return {
    username: r.username ?? "",
    displayName: r.display_name ?? "",
    followers: r.followers ?? "0",
    following: r.following ?? "0",
    bio: r.bio ?? "",
    website: r.website ?? "",
  };
}

export async function saveProfilePreview(
  clientId: string,
  data: ProfilePreview,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    MEM_PROFILE.set(`${workspaceId}:${clientId}`, { ...data });
    return;
  }
  // Guard: the client must belong to this workspace (never trust client input).
  const owns = (await sql()`
    SELECT 1 FROM clients
    WHERE id = ${clientId} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return;

  await sql()`
    INSERT INTO profile_preview
      (client_id, username, display_name, followers, following, bio, website)
    VALUES
      (${clientId}, ${data.username}, ${data.displayName}, ${data.followers},
       ${data.following}, ${data.bio}, ${data.website})
    ON CONFLICT (client_id) DO UPDATE SET
      username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      bio = EXCLUDED.bio,
      website = EXCLUDED.website
  `;
}
