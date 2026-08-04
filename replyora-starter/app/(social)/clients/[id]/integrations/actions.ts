"use server";

import { revalidatePath } from "next/cache";

import { setClientPlatform } from "@/lib/social/clients";
import { deleteConnection, type ConnPlatform } from "@/lib/social/connections";

/**
 * OAuth stub — records a platform connection for this client. When real Meta /
 * TikTok apps are configured, replace this with the token-exchange callback.
 */
export async function toggleIntegrationAction(
  clientId: string,
  platform: "instagram" | "tiktok",
  connected: boolean,
): Promise<void> {
  await setClientPlatform(clientId, platform, connected);
  revalidatePath(`/clients/${clientId}/integrations`);
  revalidatePath(`/clients/${clientId}/reports`);
  revalidatePath(`/clients/${clientId}/grid`);
}

/** Disconnect a platform — removes the stored OAuth token and the flag. */
export async function disconnectAction(
  clientId: string,
  platform: ConnPlatform,
): Promise<void> {
  await deleteConnection(clientId, platform);
  await setClientPlatform(clientId, platform, false);
  revalidatePath(`/clients/${clientId}/integrations`);
  revalidatePath(`/clients/${clientId}/reports`);
}
