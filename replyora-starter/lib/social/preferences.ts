import { neon } from "@neondatabase/serverless";

import { getCurrentUser, getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * Per-account preferences + data requests (Settings → Preferences / Data).
 * DATABASE_URL set → Neon; unset → mock defaults (local dev).
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

function genId(prefix: string): string {
  return `${prefix}_` + Math.random().toString(36).slice(2, 10);
}

/** Whether the current account is opted in to the monthly newsletter. */
export async function getNewsletterOptIn(): Promise<boolean> {
  if (!hasDb()) return false;
  const user = await getCurrentUser();
  try {
    const rows = (await sql()`
      SELECT newsletter_opt_in FROM users WHERE id = ${user.id} LIMIT 1
    `) as { newsletter_opt_in: boolean | null }[];
    return Boolean(rows[0]?.newsletter_opt_in);
  } catch {
    return false; // column not present yet (0009 not applied)
  }
}

export async function setNewsletterOptIn(optIn: boolean): Promise<void> {
  if (!hasDb()) return;
  const user = await getCurrentUser();
  try {
    await sql()`UPDATE users SET newsletter_opt_in = ${optIn} WHERE id = ${user.id}`;
  } catch {
    /* column not present yet */
  }
}

/** Record an account-deletion request with a reason (actioned manually). */
export async function requestDeletion(reason: string): Promise<void> {
  if (!hasDb()) return;
  const [workspaceId, user] = await Promise.all([
    getCurrentWorkspaceId(),
    getCurrentUser(),
  ]);
  try {
    await sql()`
      INSERT INTO deletion_requests (id, workspace_id, user_email, reason)
      VALUES (${genId("del")}, ${workspaceId}, ${user.email}, ${reason})
    `;
  } catch {
    /* table not present yet */
  }
}
