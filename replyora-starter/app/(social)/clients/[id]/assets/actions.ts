"use server";

import { revalidatePath } from "next/cache";

import {
  createAsset,
  deleteAsset,
  type AssetKind,
} from "@/lib/social/assets";

/** Record an uploaded R2 object as a client asset row. */
export async function recordAssetAction(
  clientId: string,
  input: { url: string; kind: AssetKind; folder?: string | null },
): Promise<void> {
  await createAsset({
    clientId,
    url: input.url,
    kind: input.kind,
    folder: input.folder ?? "Library",
    uploadedBy: "agency",
  });
  revalidatePath(`/clients/${clientId}/assets`);
  revalidatePath(`/clients/${clientId}/grid`);
}

export async function deleteAssetAction(
  clientId: string,
  id: string,
): Promise<void> {
  await deleteAsset(id);
  revalidatePath(`/clients/${clientId}/assets`);
}
