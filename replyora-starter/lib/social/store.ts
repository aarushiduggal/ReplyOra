import { getCurrentWorkspaceId } from "@/lib/auth/session";

import { dbDelete, dbGet, dbInsert, dbList, dbUpdate } from "./db";
import type { Platform, PostStatus, SocialPost } from "./types";

/**
 * ReplyOra Social — persistence seam.
 *
 * Two backends behind one interface:
 *   • DATABASE_URL set   → Neon (Postgres). Free, public, never pauses. (db.ts)
 *   • DATABASE_URL unset → in-memory. Free, zero-setup local dev/demo.
 *
 * The UI and server actions never change regardless of backend. Supabase is
 * intentionally not used here (its free tier pauses after 7 idle days).
 * Neon schema: db/migrations/0001_social_posts.sql
 */

/** True when a Neon/Postgres DATABASE_URL is configured (else in-memory). */
const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

// ---- In-memory fallback (local dev, no DB configured) --------------------
const POSTS: SocialPost[] = [];

function memList(workspaceId: string): SocialPost[] {
  return POSTS.filter((p) => p.workspaceId === workspaceId).sort((a, b) => {
    const as = a.scheduledFor ?? "";
    const bs = b.scheduledFor ?? "";
    if (as && bs) return as.localeCompare(bs);
    if (as) return -1;
    if (bs) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

// ---- Public interface ----------------------------------------------------

export async function listPosts(): Promise<SocialPost[]> {
  const workspaceId = await getCurrentWorkspaceId();
  return hasDb() ? dbList(workspaceId) : memList(workspaceId);
}

export async function getPost(id: string): Promise<SocialPost | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (hasDb()) return dbGet(workspaceId, id);
  return POSTS.find((p) => p.id === id && p.workspaceId === workspaceId) ?? null;
}

export interface NewPost {
  platform: Platform;
  pillar: string;
  topic: string;
  caption: string;
  hashtags: string[];
  scheduledFor: string | null;
}

export async function createPost(input: NewPost): Promise<SocialPost> {
  const workspaceId = await getCurrentWorkspaceId();
  const post: SocialPost = {
    id: "sp_" + Math.random().toString(36).slice(2, 10),
    workspaceId,
    platform: input.platform,
    pillar: input.pillar,
    topic: input.topic,
    caption: input.caption,
    hashtags: input.hashtags,
    status: input.scheduledFor ? "scheduled" : "draft",
    scheduledFor: input.scheduledFor,
    createdAt: new Date().toISOString(),
  };
  if (hasDb()) return dbInsert(post);
  POSTS.push(post);
  return post;
}

export async function updatePost(
  id: string,
  patch: Partial<Pick<SocialPost, "caption" | "hashtags" | "scheduledFor" | "status">>,
): Promise<SocialPost | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (hasDb()) return dbUpdate(workspaceId, id, patch);

  const post = POSTS.find((p) => p.id === id && p.workspaceId === workspaceId);
  if (!post) return null;
  Object.assign(post, patch);
  if (patch.scheduledFor !== undefined && patch.status === undefined) {
    post.status = patch.scheduledFor ? "scheduled" : "draft";
  }
  return post;
}

export async function setStatus(
  id: string,
  status: PostStatus,
): Promise<SocialPost | null> {
  return updatePost(id, { status });
}

export async function removePost(id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (hasDb()) return dbDelete(workspaceId, id);
  const i = POSTS.findIndex((p) => p.id === id && p.workspaceId === workspaceId);
  if (i >= 0) POSTS.splice(i, 1);
}
