import { createHmac } from "crypto";
import { neon } from "@neondatabase/serverless";

import type { ClientPost } from "@/lib/social/posts";
import type { Approval, ApprovalStatus } from "@/lib/social/approvals";
import { DEMO_CLIENT, DEMO_CLIENT_ID, demoPosts } from "@/lib/social/demo";
import { signingSecret } from "@/lib/signing-secret";

/**
 * ReplyOra Social — public client-review portal.
 *
 * A client gets a read-only, tokenised link (no login) to review the planned
 * grid and Approve / Request changes. The token is an HMAC of the client id —
 * so no schema change and it can't be forged without AUTH_SECRET. All reads and
 * writes here are scoped ONLY by the client id the token proves; they never
 * touch the agency session.
 */



function sign(clientId: string): string {
  return createHmac("sha256", signingSecret()).update(clientId).digest("base64url").slice(0, 24);
}

export function makeShareToken(clientId: string): string {
  return `${clientId}~${sign(clientId)}`;
}

export function verifyShareToken(token: string): string | null {
  const i = token.lastIndexOf("~");
  if (i < 0) return null;
  const clientId = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!clientId || !sig) return null;
  return sign(clientId) === sig ? clientId : null;
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

export interface PortalData {
  clientName: string;
  posts: ClientPost[];
  approvals: Record<string, ApprovalStatus>;
  agencyReplies: Record<string, string | null>;
  /** Agency tier hides the "Powered by replyora°" badge (white-label). */
  whiteLabel: boolean;
}

interface PostRow {
  id: string;
  client_id: string | null;
  platform: string;
  pillar: string | null;
  topic: string | null;
  caption: string | null;
  hashtags: string[] | null;
  status: string;
  scheduled_for: string | Date | null;
  order_index: number | null;
  created_at: string | Date;
}

/** Read the shared grid for the client the token authorises. */
export async function getPortalData(clientId: string): Promise<PortalData | null> {
  if (!hasDb()) {
    if (clientId === DEMO_CLIENT_ID) {
      const posts = demoPosts(Date.now()).filter(
        (p) => p.status === "scheduled" || p.status === "published",
      );
      return { clientName: DEMO_CLIENT.name, posts, approvals: {}, agencyReplies: {}, whiteLabel: true };
    }
    return { clientName: "Client", posts: [], approvals: {}, agencyReplies: {}, whiteLabel: false };
  }

  // Also resolve the owning workspace's tier — Agency accounts white-label the
  // client portal (no "Powered by replyora°").
  const clientRows = (await sql()`
    SELECT c.name, wb.address ->> 'accountType' AS account_type
    FROM clients c
    LEFT JOIN workspace_billing wb ON wb.workspace_id = c.workspace_id
    WHERE c.id = ${clientId} LIMIT 1
  `) as { name: string; account_type: string | null }[];
  const clientRow = clientRows[0];
  if (!clientRow) return null;
  const whiteLabel = clientRow.account_type === "agency";

  // Only surface posts actually shared with the client: scheduled/published, or
  // sent for approval (has an approvals row). Never serialize unshared drafts to
  // the client's browser (they'd be visible via view-source even if not rendered).
  const postRows = (await sql()`
    SELECT p.id, p.client_id, p.platform, p.pillar, p.topic, p.caption, p.hashtags,
           p.status, p.scheduled_for, p.order_index, p.created_at
    FROM social_posts p
    WHERE p.client_id = ${clientId}
      AND (
        p.status <> 'draft'
        OR EXISTS (SELECT 1 FROM approvals a WHERE a.post_id = p.id)
      )
    ORDER BY p.scheduled_for ASC NULLS LAST, p.order_index ASC, p.created_at DESC
  `) as PostRow[];

  const posts: ClientPost[] = postRows.map((r) => ({
    id: r.id,
    clientId: r.client_id ?? "",
    platform: (r.platform as ClientPost["platform"]) ?? "instagram",
    pillar: r.pillar ?? "",
    topic: r.topic ?? "",
    caption: r.caption ?? "",
    hashtags: r.hashtags ?? [],
    status: (r.status as ClientPost["status"]) ?? "draft",
    format: ((r as { format?: string }).format as ClientPost["format"]) ?? "post",
    scheduledFor: r.scheduled_for ? new Date(r.scheduled_for).toISOString() : null,
    orderIndex: r.order_index ?? 0,
    createdAt: new Date(r.created_at).toISOString(),
    mediaUrl: null,
    mediaKind: null,
    publishError: null,
  }));

  let apprRows: { post_id: string; status: string; agency_reply?: string | null }[];
  try {
    apprRows = (await sql()`
      SELECT a.post_id, a.status, a.agency_reply
      FROM approvals a
      JOIN social_posts p ON p.id = a.post_id
      WHERE p.client_id = ${clientId}
    `) as { post_id: string; status: string; agency_reply: string | null }[];
  } catch {
    // agency_reply column not present yet (0009 not applied).
    apprRows = (await sql()`
      SELECT a.post_id, a.status
      FROM approvals a
      JOIN social_posts p ON p.id = a.post_id
      WHERE p.client_id = ${clientId}
    `) as { post_id: string; status: string }[];
  }
  const approvals: Record<string, ApprovalStatus> = {};
  const agencyReplies: Record<string, string | null> = {};
  for (const r of apprRows) {
    approvals[r.post_id] = r.status as ApprovalStatus;
    agencyReplies[r.post_id] = r.agency_reply ?? null;
  }

  return { clientName: clientRow.name, posts, approvals, agencyReplies, whiteLabel };
}

/** Client's Approve / Request-changes decision (public, token-authorised). */
export async function decidePortalApproval(
  clientId: string,
  postId: string,
  status: Exclude<ApprovalStatus, "pending">,
  note: string,
): Promise<boolean> {
  if (!hasDb()) return true;
  // The post must belong to the token's client.
  const owns = (await sql()`
    SELECT 1 FROM social_posts WHERE id = ${postId} AND client_id = ${clientId} LIMIT 1
  `) as unknown[];
  if (owns.length === 0) return false;

  const decidedAt = new Date().toISOString();
  await sql()`
    INSERT INTO approvals (post_id, status, client_note, decided_at)
    VALUES (${postId}, ${status}, ${note || null}, ${decidedAt})
    ON CONFLICT (post_id) DO UPDATE SET
      status = ${status}, client_note = ${note || null}, decided_at = ${decidedAt}
  `;
  return true;
}

/** Approval summary counts for a client (used by the agency Overview). */
export async function approvalCounts(
  approvals: Record<string, ApprovalStatus> | Map<string, Approval>,
): Promise<{ pending: number; approved: number; changes: number }> {
  const values =
    approvals instanceof Map
      ? Array.from(approvals.values()).map((a) => a.status)
      : Object.values(approvals);
  return {
    pending: values.filter((s) => s === "pending").length,
    approved: values.filter((s) => s === "approved").length,
    changes: values.filter((s) => s === "changes").length,
  };
}
