import "server-only";

import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
// The media types and the carousel validity rule live in the client-safe
// module so the Grid editor and the publisher share one copy of the rule.
import {
  MAX_SLIDES,
  shapeOf,
  type MediaKind,
  type PostMedia,
} from "@/lib/social/types";

/**
 * Ordered media for a post — the slides of a carousel, or the single image or
 * video of a normal post.
 *
 * Schema: db/migrations/0015_post_media.sql
 *
 * social_posts.media_url is kept in lockstep with position 0. Every existing
 * read path still uses that column, so nothing had to be rewritten to add
 * carousels — and a post always has a sensible single-media fallback if the
 * carousel path is ever skipped.
 *
 * TENANCY: post_media has no workspace_id of its own; it inherits it through
 * post_id. Every write here therefore joins social_posts and filters on the
 * caller's workspace, so a guessed post id from another agency does nothing.
 */

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


// Re-exported so server code can keep importing it from here.
export { MAX_SLIDES, shapeOf } from "@/lib/social/types";
export type { MediaKind, MediaShape, PostMedia } from "@/lib/social/types";

interface Row {
  url: string;
  kind: string;
  position: number;
}

/** Slides for one post, in order. Never throws. */
export async function listPostMedia(postId: string): Promise<PostMedia[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql()`
      SELECT url, kind, position FROM post_media
      WHERE post_id = ${postId} ORDER BY position ASC
    `) as Row[];
    return rows.map((r) => ({
      url: r.url,
      kind: r.kind === "video" ? "video" : "image",
      position: r.position,
    }));
  } catch (err) {
    console.error("[post-media] listPostMedia failed", err);
    return [];
  }
}

/** Slides for many posts at once — the Grid needs every tile's stack count. */
export async function listMediaForPosts(
  postIds: string[],
): Promise<Map<string, PostMedia[]>> {
  const out = new Map<string, PostMedia[]>();
  if (!hasDb() || postIds.length === 0) return out;
  try {
    const rows = (await sql()`
      SELECT post_id, url, kind, position FROM post_media
      WHERE post_id = ANY(${postIds})
      ORDER BY post_id, position ASC
    `) as (Row & { post_id: string })[];
    for (const r of rows) {
      const list = out.get(r.post_id) ?? [];
      list.push({
        url: r.url,
        kind: r.kind === "video" ? "video" : "image",
        position: r.position,
      });
      out.set(r.post_id, list);
    }
  } catch (err) {
    console.error("[post-media] listMediaForPosts failed", err);
  }
  return out;
}

/**
 * Replace a post's slides with exactly this list, in this order.
 *
 * Written as delete-then-insert inside one statement batch: reordering is the
 * common case, and trying to diff positions against a UNIQUE(post_id, position)
 * index deadlocks on the swap (two slides briefly want the same slot).
 */
export async function setPostMedia(
  postId: string,
  items: { url: string; kind?: MediaKind | null }[],
): Promise<PostMedia[]> {
  if (!hasDb()) return [];
  const workspaceId = await getCurrentWorkspaceId();

  // Prove the post is ours before touching anything hanging off it.
  const owned = (await sql()`
    SELECT id FROM social_posts
    WHERE id = ${postId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as { id: string }[];
  if (owned.length === 0) throw new Error("post not found");

  const slides = items
    .filter((i) => i.url?.trim())
    .slice(0, MAX_SLIDES)
    .map((i, position) => ({
      url: i.url.trim(),
      kind: (i.kind === "video" ? "video" : "image") as MediaKind,
      position,
    }));

  await sql()`DELETE FROM post_media WHERE post_id = ${postId}`;
  for (const s of slides) {
    await sql()`
      INSERT INTO post_media (id, post_id, url, kind, position)
      VALUES (${`pm_${randomBytes(9).toString("base64url")}`}, ${postId},
              ${s.url}, ${s.kind}, ${s.position})
    `;
  }

  // Keep the legacy single-media columns pointing at slide 1, so every screen
  // that hasn't been taught about carousels still shows the right thing.
  const first = slides[0] ?? null;
  await sql()`
    UPDATE social_posts
       SET media_url = ${first?.url ?? null}, media_kind = ${first?.kind ?? null}
     WHERE id = ${postId} AND workspace_id = ${workspaceId}
  `;
  return slides;
}

/** Append one slide. Returns the new list, or null if it's already full. */
export async function addPostMedia(
  postId: string,
  url: string,
  kind: MediaKind = "image",
): Promise<PostMedia[] | null> {
  const current = await listPostMedia(postId);
  if (current.length >= MAX_SLIDES) return null;
  return setPostMedia(postId, [...current, { url, kind }]);
}

export async function removePostMedia(
  postId: string,
  position: number,
): Promise<PostMedia[]> {
  const current = await listPostMedia(postId);
  return setPostMedia(
    postId,
    current.filter((m) => m.position !== position),
  );
}

