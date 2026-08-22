"use server";

import { revalidatePath } from "next/cache";

import {
  bulkDeleteTiles,
  bulkSetTileStatus,
  reorderClientTiles,
  saveProfilePreview,
  scheduleTiles,
  setTileMedia,
  unscheduleTile,
  type GridTile,
  type ProfilePreview,
  type TileStatus,
} from "@/lib/social/grid";
import { createClientPost } from "@/lib/social/posts";
import {
  listPostMedia,
  setPostMedia,
  type PostMedia,
} from "@/lib/social/post-media";
import type { Platform } from "@/lib/social/types";

/** Create a new empty planned tile (the "+" on the grid) — fill it by dragging an asset. */
export async function addEmptyTileAction(
  clientId: string,
  platform: Platform,
): Promise<GridTile> {
  const post = await createClientPost({
    clientId,
    platform,
    status: "draft",
    caption: "",
    mediaUrl: null,
  });
  revalidatePath(`/clients/${clientId}/grid`);
  return {
    id: post.id,
    caption: "",
    status: "draft",
    platform,
    pillar: "",
    orderIndex: 0,
    mediaUrl: null,
    mediaKind: null,
    mediaCount: 0,
    format: "post" as const,
    scheduledFor: null,
    publishError: null,
  };
}

/** Save the Instagram profile-preview shown on the iPhone mock. */
export async function saveProfilePreviewAction(
  clientId: string,
  data: ProfilePreview,
): Promise<void> {
  await saveProfilePreview(clientId, data);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Persist the feed tile order (drag-to-reorder → social_posts.order_index). */
export async function reorderTilesAction(
  clientId: string,
  orderedIds: string[],
): Promise<void> {
  await reorderClientTiles(clientId, orderedIds);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Place (or clear) an asset image on a grid tile — drag-to-place. */
export async function placeAssetAction(
  clientId: string,
  tileId: string,
  mediaUrl: string | null,
): Promise<void> {
  await setTileMedia(clientId, tileId, mediaUrl);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Bulk status change for the current multi-selection. */
export async function bulkStatusAction(
  clientId: string,
  ids: string[],
  status: TileStatus,
): Promise<void> {
  await bulkSetTileStatus(clientId, ids, status);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Bulk delete for the current multi-selection. */
export async function bulkDeleteAction(
  clientId: string,
  ids: string[],
): Promise<void> {
  await bulkDeleteTiles(clientId, ids);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Schedule the selected tiles for a real date/time — they appear on the calendar. */
export async function scheduleTilesAction(
  clientId: string,
  ids: string[],
  scheduledForIso: string,
): Promise<void> {
  await scheduleTiles(clientId, ids, scheduledForIso);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
}

/** Remove a single post from the schedule (back to draft, clears the date). */
export async function unscheduleTileAction(
  clientId: string,
  tileId: string,
): Promise<void> {
  await unscheduleTile(clientId, tileId);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
}

/* ── Carousel slides ──────────────────────────────────────────────────── */

/**
 * Read a post's slides. Used when the editor opens, so a carousel that was
 * built earlier comes back in the right order.
 */
export async function listSlidesAction(postId: string): Promise<PostMedia[]> {
  return listPostMedia(postId);
}

/**
 * Replace a post's slides with this exact list, in this order.
 *
 * The whole list is sent rather than a diff: reordering is the common edit and
 * a positional diff against a UNIQUE(post_id, position) index deadlocks on the
 * swap. setPostMedia verifies the post belongs to the caller's workspace.
 */
export async function saveSlidesAction(
  clientId: string,
  postId: string,
  slides: { url: string; kind?: "image" | "video" | null }[],
): Promise<PostMedia[]> {
  const saved = await setPostMedia(postId, slides);
  revalidatePath(`/clients/${clientId}/grid`);
  revalidatePath(`/clients/${clientId}/calendar`);
  return saved;
}
