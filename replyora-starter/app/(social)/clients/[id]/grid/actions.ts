"use server";

import { revalidatePath } from "next/cache";

import {
  bulkDeleteTiles,
  bulkSetTileStatus,
  reorderClientTiles,
  saveProfilePreview,
  setTileMedia,
  type ProfilePreview,
  type TileStatus,
} from "@/lib/social/grid";

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
