import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import type { Platform, PostStatus } from "@/lib/social/types";

/**
 * ReplyOra Social — client-scoped post CRUD (shared by Calendar, Studio,
 * Approvals). Sits on social_posts (+ client_id, + order_index). Every call is
 * scoped by the agency workspace_id (from the session) AND client_id.
 *
 * DATABASE_URL set → Neon; unset → in-memory (local dev).
 * Schema: db/migrations/0001_social_posts.sql + 0003_agency_clients.sql
 */

export interface ClientPost {
  id: string;
  clientId: string;
  platform: Platform;
  pillar: string;
  topic: string;
  caption: string;
  hashtags: string[];
  status: PostStatus;
  scheduledFor: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface NewClientPost {
  clientId: string;
  platform?: Platform;
  pillar?: string;
  topic?: string;
  caption?: string;
  hashtags?: string[];
  status?: PostStatus;
  scheduledFor?: string | null;
}

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

function genId(): string {
  return "sp_" + Math.random().toString(36).slice(2, 10);
}

// ---- In-memory fallback --------------------------------------------------
interface MemPost extends ClientPost {
  workspaceId: string;
}
const MEM: MemPost[] = [];

interface Row {
  id: string;
  client_id: string | null;
  platform: string;
  pillar: string | null;
  topic: string | null;
  caption: string | null;
  hashtags: string[] | null;
  status: string;
  scheduled_for: string | Date | null;
  order_index: number | null;
  created_at: string | Date;
}

function toPost(r: Row): ClientPost {
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    platform: (r.platform as Platform) ?? "instagram",
    pillar: r.pillar ?? "",
    topic: r.topic ?? "",
    caption: r.caption ?? "",
    hashtags: r.hashtags ?? [],
    status: (r.status as PostStatus) ?? "draft",
    scheduledFor: r.scheduled_for
      ? new Date(r.scheduled_for).toISOString()
      : null,
    orderIndex: r.order_index ?? 0,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// ---- Public interface ----------------------------------------------------

export async function listClientPosts(clientId: string): Promise<ClientPost[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM.filter(
      (p) => p.workspaceId === workspaceId && p.clientId === clientId,
    ).sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
  }
  const rows = (await sql()`
    SELECT id, client_id, platform, pillar, topic, caption, hashtags,
           status, scheduled_for, order_index, created_at
    FROM social_posts
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId}
    ORDER BY scheduled_for ASC NULLS LAST, order_index ASC, created_at DESC
  `) as Row[];
  return rows.map(toPost);
}

export async function createClientPost(
  input: NewClientPost,
): Promise<ClientPost> {
  const workspaceId = await getCurrentWorkspaceId();
  const post: ClientPost = {
    id: genId(),
    clientId: input.clientId,
    platform: input.platform ?? "instagram",
    pillar: input.pillar ?? "",
    topic: input.topic ?? "",
    caption: input.caption ?? "",
    hashtags: input.hashtags ?? [],
    status: input.status ?? (input.scheduledFor ? "scheduled" : "draft"),
    scheduledFor: input.scheduledFor ?? null,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
  };
  if (!hasDb()) {
    MEM.push({ ...post, workspaceId });
    return post;
  }
  await sql()`
    INSERT INTO social_posts
      (id, workspace_id, client_id, platform, pillar, topic, caption,
       hashtags, status, scheduled_for, order_index, created_at)
    VALUES
      (${post.id}, ${workspaceId}, ${post.clientId}, ${post.platform},
       ${post.pillar}, ${post.topic}, ${post.caption}, ${post.hashtags},
       ${post.status}, ${post.scheduledFor}, ${post.orderIndex}, ${post.createdAt})
  `;
  return post;
}

export async function updateClientPost(
  id: string,
  patch: Partial<
    Pick<
      ClientPost,
      "caption" | "pillar" | "topic" | "status" | "scheduledFor" | "platform"
    >
  >,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const p = MEM.find((x) => x.id === id && x.workspaceId === workspaceId);
    if (p) Object.assign(p, patch);
    return;
  }
  const rows = (await sql()`
    SELECT id, client_id, platform, pillar, topic, caption, hashtags,
           status, scheduled_for, order_index, created_at
    FROM social_posts
    WHERE workspace_id = ${workspaceId} AND id = ${id}
    LIMIT 1
  `) as Row[];
  const current = rows[0];
  if (!current) return;
  const next = { ...toPost(current), ...patch };
  await sql()`
    UPDATE social_posts SET
      caption = ${next.caption},
      pillar = ${next.pillar},
      topic = ${next.topic},
      platform = ${next.platform},
      status = ${next.status},
      scheduled_for = ${next.scheduledFor}
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}

export async function deleteClientPost(id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const i = MEM.findIndex(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    if (i >= 0) MEM.splice(i, 1);
    return;
  }
  await sql()`
    DELETE FROM social_posts
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}
