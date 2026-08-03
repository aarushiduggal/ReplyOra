import { neon } from "@neondatabase/serverless";

import type { SocialPost } from "./types";

/**
 * ReplyOra Social — Neon (Postgres) persistence.
 *
 * Used automatically when DATABASE_URL is set (production / deployed). Neon's
 * free tier auto-wakes instantly and never does Supabase's 7-day pause. When
 * DATABASE_URL is absent (local dev), store.ts falls back to in-memory so the
 * app still runs free with zero setup.
 *
 * Schema: db/migrations/0001_social_posts.sql
 */

// Lazily create the SQL client so importing this file never crashes when
// DATABASE_URL is unset (store.ts guards on it before calling anything here).
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

interface Row {
  id: string;
  workspace_id: string;
  platform: string;
  pillar: string;
  topic: string;
  caption: string;
  hashtags: string[] | null;
  status: string;
  scheduled_for: string | Date | null;
  created_at: string | Date;
}

function toPost(r: Row): SocialPost {
  const scheduled = r.scheduled_for
    ? new Date(r.scheduled_for).toISOString()
    : null;
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    platform: r.platform as SocialPost["platform"],
    pillar: r.pillar,
    topic: r.topic,
    caption: r.caption,
    hashtags: r.hashtags ?? [],
    status: r.status as SocialPost["status"],
    scheduledFor: scheduled,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function dbList(workspaceId: string): Promise<SocialPost[]> {
  const rows = (await sql()`
    SELECT * FROM social_posts
    WHERE workspace_id = ${workspaceId}
    ORDER BY
      CASE WHEN scheduled_for IS NULL THEN 1 ELSE 0 END,
      scheduled_for ASC,
      created_at DESC
  `) as Row[];
  return rows.map(toPost);
}

export async function dbGet(
  workspaceId: string,
  id: string,
): Promise<SocialPost | null> {
  const rows = (await sql()`
    SELECT * FROM social_posts
    WHERE workspace_id = ${workspaceId} AND id = ${id}
    LIMIT 1
  `) as Row[];
  return rows[0] ? toPost(rows[0]) : null;
}

export async function dbInsert(post: SocialPost): Promise<SocialPost> {
  await sql()`
    INSERT INTO social_posts
      (id, workspace_id, platform, pillar, topic, caption, hashtags, status, scheduled_for, created_at)
    VALUES
      (${post.id}, ${post.workspaceId}, ${post.platform}, ${post.pillar},
       ${post.topic}, ${post.caption}, ${post.hashtags}, ${post.status},
       ${post.scheduledFor}, ${post.createdAt})
  `;
  return post;
}

export async function dbUpdate(
  workspaceId: string,
  id: string,
  patch: Partial<Pick<SocialPost, "caption" | "hashtags" | "scheduledFor" | "status">>,
): Promise<SocialPost | null> {
  const current = await dbGet(workspaceId, id);
  if (!current) return null;
  const next: SocialPost = { ...current, ...patch };
  if (patch.scheduledFor !== undefined && patch.status === undefined) {
    next.status = patch.scheduledFor ? "scheduled" : "draft";
  }
  await sql()`
    UPDATE social_posts SET
      caption = ${next.caption},
      hashtags = ${next.hashtags},
      status = ${next.status},
      scheduled_for = ${next.scheduledFor}
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
  return next;
}

export async function dbDelete(workspaceId: string, id: string): Promise<void> {
  await sql()`
    DELETE FROM social_posts
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}
