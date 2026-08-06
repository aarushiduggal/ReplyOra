import "server-only";

import {
  getClientProfileId,
  setClientProfileId,
} from "@/lib/social/clients";
import { upsertConnection, type ConnPlatform } from "@/lib/social/connections";

/**
 * PostPeer — managed publishing API client (server-only).
 *
 * Agency model: each Replyora CLIENT maps to one PostPeer "profile" (a label that
 * groups that client's own connected social accounts). We create a profile per
 * client, hand the client an OAuth link to connect THEIR OWN Instagram / TikTok /
 * Facebook, then read back the resulting account ids to publish on their behalf.
 * This is why a client's accounts — not the agency's — get linked.
 *
 * Docs: https://www.postpeer.dev/docs
 */

const BASE = "https://api.postpeer.dev/v1";

export const HAS_POSTPEER = Boolean(process.env.POSTPEER_API_KEY);

/** PostPeer platform slugs line up with ours. */
export type PPPlatform = "instagram" | "tiktok" | "facebook";

interface PPIntegration {
  id: string;
  platform: string;
  platformUserId?: string;
  username?: string;
  profileId?: string;
}

function key(): string {
  const k = process.env.POSTPEER_API_KEY;
  if (!k) throw new Error("POSTPEER_API_KEY is not set");
  return k;
}

async function pp<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "x-access-key": key(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
    message?: string;
  };
  if (!res.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? `postpeer_${res.status}`);
  }
  return data as T;
}

/** Create a PostPeer profile for a client. Returns the new profile id. */
export async function createProfile(name: string): Promise<string> {
  const data = await pp<{ profile: { id: string } }>("/profiles", {
    method: "POST",
    body: { name },
  });
  return data.profile.id;
}

/**
 * Get the OAuth URL a client visits to connect their own account for `platform`,
 * bound to their profile so we can tell which integration was just created.
 */
export async function getConnectUrl(
  platform: PPPlatform,
  profileId: string,
): Promise<string> {
  const data = await pp<{ url: string }>(
    `/connect/${platform}?profileId=${encodeURIComponent(profileId)}`,
  );
  return data.url;
}

/** The accounts connected under a client's profile (id = accountId for posting). */
export async function listIntegrations(
  profileId: string,
): Promise<PPIntegration[]> {
  const data = await pp<{ integrations: PPIntegration[] }>(
    `/connect/integrations?profileId=${encodeURIComponent(profileId)}`,
  );
  return data.integrations ?? [];
}

// ---- Orchestration (session-scoped: runs in the agency's session) ----------

/** Get the client's PostPeer profile id, creating one on first use. */
export async function ensureClientProfile(
  clientId: string,
  clientName: string,
): Promise<string> {
  const existing = await getClientProfileId(clientId);
  if (existing) return existing;
  const id = await createProfile(clientName || "Client");
  await setClientProfileId(clientId, id);
  return id;
}

const KNOWN: ConnPlatform[] = ["instagram", "tiktok", "facebook"];

/**
 * Pull the accounts a client has connected on PostPeer and mirror them into
 * client_connections (external_account_id = PostPeer accountId), so publishing
 * and the Integrations UI see them. Safe to call on every page load.
 */
export async function syncClientConnections(clientId: string): Promise<void> {
  const profileId = await getClientProfileId(clientId);
  if (!profileId) return;
  let integrations: PPIntegration[] = [];
  try {
    integrations = await listIntegrations(profileId);
  } catch {
    return; // network/key issue — leave existing connections as-is
  }
  for (const it of integrations) {
    const platform = it.platform as ConnPlatform;
    if (!KNOWN.includes(platform)) continue;
    await upsertConnection(clientId, platform, {
      externalAccountId: it.id,
      externalUsername: it.username ?? it.platformUserId ?? null,
    });
  }
}
