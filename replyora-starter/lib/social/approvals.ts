import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * ReplyOra Social — post approvals (client sign-off). One row per post in the
 * `approvals` table (post_id PK). Used by the Calendar approval-queue tab, the
 * client portal (Section E), and Overview counts.
 *
 * Reads are workspace-scoped via a join to social_posts so an agency only ever
 * sees its own clients' approvals. Client-portal writes are validated against a
 * share token, not the session (see lib/social/portal.ts).
 */

export type ApprovalStatus = "pending" | "approved" | "changes";

export interface Approval {
  postId: string;
  status: ApprovalStatus;
  clientNote: string | null;
  decidedAt: string | null;
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

const MEM = new Map<string, Approval>(); // key: postId

interface Row {
  post_id: string;
  status: string;
  client_note: string | null;
  decided_at: string | Date | null;
}

function toApproval(r: Row): Approval {
  return {
    postId: r.post_id,
    status: (r.status as ApprovalStatus) ?? "pending",
    clientNote: r.client_note,
    decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
  };
}

/** All approvals for a client's posts, keyed by post id. */
export async function getClientApprovals(
  clientId: string,
): Promise<Map<string, Approval>> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) return new Map(MEM);
  const rows = (await sql()`
    SELECT a.post_id, a.status, a.client_note, a.decided_at
    FROM approvals a
    JOIN social_posts p ON p.id = a.post_id
    WHERE p.workspace_id = ${workspaceId} AND p.client_id = ${clientId}
  `) as Row[];
  const map = new Map<string, Approval>();
  for (const r of rows) map.set(r.post_id, toApproval(r));
  return map;
}

/** Agency sends a post to the client for review (status → pending). */
export async function sendForApproval(postId: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    MEM.set(postId, {
      postId,
      status: "pending",
      clientNote: null,
      decidedAt: null,
    });
    return;
  }
  // Only allow if the post belongs to this workspace.
  const owns = (await sql()`
    SELECT 1 FROM social_posts
    WHERE id = ${postId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return;
  await sql()`
    INSERT INTO approvals (post_id, status, client_note, decided_at)
    VALUES (${postId}, 'pending', NULL, NULL)
    ON CONFLICT (post_id) DO UPDATE SET
      status = 'pending', client_note = NULL, decided_at = NULL
  `;
}
