"use server";

import { revalidatePath } from "next/cache";

import {
  reorderClientTiles,
  saveProfilePreview,
  type ProfilePreview,
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
