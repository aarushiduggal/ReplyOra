import "server-only";

import { neon } from "@neondatabase/serverless";

/**
 * Instagram long-lived tokens (IG-Login API) last ~60 days and must be
 * refreshed before they expire, or publishing, the live grid, and insights all
 * start failing with an auth error. This runs session-less (cross-workspace)
 * from a cron, so callers MUST be CRON_SECRET-gated.
 *
 * IG refresh: GET graph.instagram.com/refresh_access_token?grant_type=
 * ig_refresh_token&access_token=<current>. The token must still be valid and at
 * least 24h old, so we only touch tokens expiring within the next 10 days.
 */

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

const SIXTY_DAYS_S = 60 * 24 * 60 * 60;

export async function refreshExpiringInstagramTokens(): Promise<{
  refreshed: number;
  failed: number;
}> {
  if (!hasDb()) return { refreshed: 0, failed: 0 };
  const rows = (await sql()`
    SELECT id, access_token
    FROM client_connections
    WHERE platform = 'instagram'
      AND access_token IS NOT NULL
      AND expires_at IS NOT NULL
      AND expires_at > now()
      AND expires_at <= now() + interval '10 days'
    LIMIT 100
  `) as { id: string; access_token: string }[];

  let refreshed = 0;
  let failed = 0;
  for (const r of rows) {
    try {
      const res = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(r.access_token)}`,
      );
      const data = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      if (res.ok && data.access_token) {
        const expiresAt = new Date(
          Date.now() + (data.expires_in ?? SIXTY_DAYS_S) * 1000,
        ).toISOString();
        await sql()`
          UPDATE client_connections
          SET access_token = ${data.access_token}, expires_at = ${expiresAt}
          WHERE id = ${r.id}
        `;
        refreshed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { refreshed, failed };
}
