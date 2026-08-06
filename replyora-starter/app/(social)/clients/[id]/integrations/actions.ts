"use server";

import { revalidatePath } from "next/cache";

import { setClientPlatform } from "@/lib/social/clients";
import {
  deleteConnection,
  upsertConnection,
  type ConnPlatform,
} from "@/lib/social/connections";

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

/**
 * Link a client's account to our publisher (PostPeer) by storing its account id.
 * The id comes from the PostPeer dashboard's connected-accounts list. Passing an
 * empty id unlinks the platform.
 */
export async function linkPublisherAccountAction(
  clientId: string,
  platform: "instagram" | "tiktok",
  accountId: string,
): Promise<void> {
  const id = accountId.trim();
  if (id) {
    await upsertConnection(clientId, platform, { externalAccountId: id });
    await setClientPlatform(clientId, platform, true);
  } else {
    await deleteConnection(clientId, platform);
    await setClientPlatform(clientId, platform, false);
  }
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
