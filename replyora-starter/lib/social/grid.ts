import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

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

export interface GridTile {
  id: string;
  caption: string;
  status: "draft" | "scheduled" | "published";
  pillar: string;
  orderIndex: number;
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
  pillar: string | null;
  order_index: number | null;
}

export async function listClientTiles(clientId: string): Promise<GridTile[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return [];
  const rows = (await sql()`
    SELECT id, caption, status, pillar, order_index
    FROM social_posts
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId}
    ORDER BY order_index ASC NULLS LAST, created_at DESC
  `) as TileRow[];
  return rows.map((r, i) => ({
    id: r.id,
    caption: r.caption ?? "",
    status: (r.status as GridTile["status"]) ?? "draft",
    pillar: r.pillar ?? "",
    orderIndex: r.order_index ?? i,
  }));
}

/** Persist the feed order — writes order_index in the given id sequence. */
export async function reorderClientTiles(
  clientId: string,
  orderedIds: string[],
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  for (let i = 0; i < orderedIds.length; i++) {
    await sql()`
      UPDATE social_posts SET order_index = ${i}
      WHERE workspace_id = ${workspaceId}
        AND client_id = ${clientId}
        AND id = ${orderedIds[i]}
    `;
  }
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
    return MEM_PROFILE.get(`${workspaceId}:${clientId}`) ?? { ...EMPTY_PROFILE };
  }
  const rows = (await sql()`
    SELECT username, display_name, followers, following, bio, website
    FROM profile_preview
    WHERE client_id = ${clientId}
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
