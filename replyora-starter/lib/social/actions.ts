"use server";

/**
 * ReplyOra Social — server-action write boundary.
 * Client components import from here; server-only store/generator code stays
 * out of the client bundle. Mirrors lib/data/actions.ts conventions.
 */

import { revalidatePath } from "next/cache";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { getImpersonation } from "@/lib/admin/access";

import { generatePosts, type GenerateInput, type GeneratedPost } from "./generate";
import { createPost, removePost, setStatus, updatePost, type NewPost } from "./store";
import type { PostStatus, SocialPost } from "./types";

const STUDIO = "/dashboard/studio";
const CALENDAR = "/dashboard/planner";

async function guard() {
  const imp = await getImpersonation();
  if (imp?.mode === "view") {
    throw new Error(
      "Read-only: you're viewing as this client. Switch to Manage to make changes.",
    );
  }
  await getCurrentWorkspaceId();
}

/** Generate caption drafts (no save). Free local generator; swap to a real
 *  free LLM inside generate.ts later without changing this signature. */
export async function draftPosts(input: GenerateInput): Promise<GeneratedPost[]> {
  await guard();
  return generatePosts(input);
}

/** Save a post — as a plain draft, or scheduled if scheduledFor is set. */
export async function savePost(input: NewPost): Promise<SocialPost> {
  await guard();
  const post = await createPost(input);
  revalidatePath(STUDIO);
  revalidatePath(CALENDAR);
  return post;
}

export async function editPost(
  id: string,
  patch: Partial<Pick<SocialPost, "caption" | "hashtags" | "scheduledFor" | "status">>,
): Promise<SocialPost | null> {
  await guard();
  const post = await updatePost(id, patch);
  revalidatePath(CALENDAR);
  return post;
}

export async function reschedulePost(
  id: string,
  scheduledFor: string | null,
): Promise<SocialPost | null> {
  await guard();
  const post = await updatePost(id, { scheduledFor });
  revalidatePath(CALENDAR);
  return post;
}

export async function markStatus(
  id: string,
  status: PostStatus,
): Promise<SocialPost | null> {
  await guard();
  const post = await setStatus(id, status);
  revalidatePath(CALENDAR);
  return post;
}

export async function deletePost(id: string): Promise<void> {
  await guard();
  await removePost(id);
  revalidatePath(CALENDAR);
}
