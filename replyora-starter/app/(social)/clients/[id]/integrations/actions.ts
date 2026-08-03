"use server";

import { revalidatePath } from "next/cache";

import { setClientPlatform } from "@/lib/social/clients";

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
