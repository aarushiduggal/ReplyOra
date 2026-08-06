import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * ReplyOra Social — per-client social connections (OAuth tokens for publishing).
 * Neon table: client_connections (db/migrations/0004_publishing.sql).
 *
 * Reads/writes here are session-scoped (the agency connecting its clients). The
 * publish orchestrator (lib/social/publish.ts) loads tokens by explicit
 * workspace_id so the secret-guarded cron can publish without a session.
 */

export type ConnPlatform = "instagram" | "tiktok" | "facebook";

export interface ClientConnection {
  clientId: string;
  platform: ConnPlatform;
  externalAccountId: string | null;
  externalUsername: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

function genId(): string {
  return "cx_" + Math.random().toString(36).slice(2, 10);
}

interface Row {
  client_id: string;
  platform: string;
  external_account_id: string | null;
  external_username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | Date | null;
}

function toConn(r: Row): ClientConnection {
  return {
    clientId: r.client_id,
    platform: r.platform as ConnPlatform,
    externalAccountId: r.external_account_id,
    externalUsername: r.external_username,
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
  };
}

/** Connections for a client (agency UI). Tokens included — server-only callers. */
export async function listClientConnections(
  clientId: string,
): Promise<ClientConnection[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return [];
  try {
    const rows = (await sql()`
      SELECT client_id, platform, external_account_id, external_username,
             access_token, refresh_token, expires_at
      FROM client_connections
      WHERE workspace_id = ${workspaceId} AND client_id = ${clientId}
    `) as Row[];
    return rows.map(toConn);
  } catch {
    // client_connections table not created yet (migration 0004) — treat as none.
    return [];
  }
}

/** Store (or replace) a client's connection for a platform. Session-scoped. */
export async function upsertConnection(
  clientId: string,
  platform: ConnPlatform,
  data: {
    externalAccountId?: string | null;
    externalUsername?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: string | null;
  },
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  // The client must belong to this workspace.
  const owns = (await sql()`
    SELECT 1 FROM clients WHERE id = ${clientId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return;

  await sql()`
    INSERT INTO client_connections
      (id, workspace_id, client_id, platform, external_account_id,
       external_username, access_token, refresh_token, expires_at)
    VALUES
      (${genId()}, ${workspaceId}, ${clientId}, ${platform},
       ${data.externalAccountId ?? null}, ${data.externalUsername ?? null},
       ${data.accessToken ?? null}, ${data.refreshToken ?? null},
       ${data.expiresAt ?? null})
    ON CONFLICT (client_id, platform) DO UPDATE SET
      external_account_id = EXCLUDED.external_account_id,
      external_username = EXCLUDED.external_username,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at
  `;
}

export async function deleteConnection(
  clientId: string,
  platform: ConnPlatform,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return;
  await sql()`
    DELETE FROM client_connections
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId} AND platform = ${platform}
  `;
}
