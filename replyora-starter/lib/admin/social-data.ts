import "server-only";

import { neon } from "@neondatabase/serverless";

/**
 * Staff-portal reads (Neon). Cross-workspace, so callers MUST be gated by
 * isStaff() before invoking these. Read-only support views — no money actions.
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

export interface WorkspaceRow {
  id: string;
  name: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string | null;
  accountType: string | null;
  planStatus: string;
  clientCount: number;
  newsletterOptIn: boolean;
  addons: { chatbox: boolean; reports: boolean };
  postsThisMonth: number;
}

interface Row {
  id: string;
  name: string;
  created_at: string | Date;
  owner_email: string;
  owner_name: string | null;
  account_type: string | null;
  plan_status: string | null;
  client_count: number;
  newsletter_opt_in: boolean | null;
  addons: { chatbox?: boolean; reports?: boolean } | null;
  posts_this_month: number | null;
}

function toRow(r: Row): WorkspaceRow {
  return {
    id: r.id,
    name: r.name,
    createdAt: new Date(r.created_at).toISOString(),
    ownerEmail: r.owner_email,
    ownerName: r.owner_name,
    accountType: r.account_type,
    planStatus: r.plan_status ?? "trialing",
    clientCount: Number(r.client_count ?? 0),
    newsletterOptIn: Boolean(r.newsletter_opt_in),
    addons: {
      chatbox: Boolean(r.addons?.chatbox),
      reports: Boolean(r.addons?.reports),
    },
    postsThisMonth: Number(r.posts_this_month ?? 0),
  };
}

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  if (!hasDb()) return [];
  // Real add-ons (from billing JSON) + this-month post volume, so the staff
  // overview's MRR and activity reflect live data, not placeholders.
  // newsletter_opt_in is guarded — the column may not exist until 0009 runs.
  let rows: Row[];
  try {
    rows = (await sql()`
      SELECT w.id, w.name, w.created_at,
             u.email AS owner_email, u.name AS owner_name,
             u.newsletter_opt_in AS newsletter_opt_in,
             wb.address ->> 'accountType' AS account_type,
             wb.address ->> 'planStatus' AS plan_status,
             wb.address -> 'addons' AS addons,
             (SELECT count(*)::int FROM clients c WHERE c.workspace_id = w.id) AS client_count,
             (SELECT count(*)::int FROM social_posts p
                WHERE p.workspace_id = w.id
                  AND p.created_at >= date_trunc('month', now())) AS posts_this_month
      FROM workspaces w
      JOIN users u ON u.id = w.owner_id
      LEFT JOIN workspace_billing wb ON wb.workspace_id = w.id
      ORDER BY w.created_at DESC
    `) as Row[];
  } catch {
    rows = (await sql()`
      SELECT w.id, w.name, w.created_at,
             u.email AS owner_email, u.name AS owner_name,
             NULL AS newsletter_opt_in,
             wb.address ->> 'accountType' AS account_type,
             wb.address ->> 'planStatus' AS plan_status,
             wb.address -> 'addons' AS addons,
             (SELECT count(*)::int FROM clients c WHERE c.workspace_id = w.id) AS client_count,
             (SELECT count(*)::int FROM social_posts p
                WHERE p.workspace_id = w.id
                  AND p.created_at >= date_trunc('month', now())) AS posts_this_month
      FROM workspaces w
      JOIN users u ON u.id = w.owner_id
      LEFT JOIN workspace_billing wb ON wb.workspace_id = w.id
      ORDER BY w.created_at DESC
    `) as Row[];
  }
  return rows.map(toRow);
}

export interface WorkspaceDetail extends WorkspaceRow {
  clients: { id: string; name: string; createdAt: string }[];
  postCount: number;
  invoiceCount: number;
  invoiceTotalCents: number;
}

export async function getWorkspaceDetail(
  workspaceId: string,
): Promise<WorkspaceDetail | null> {
  if (!hasDb()) return null;
  const rows = (await sql()`
    SELECT w.id, w.name, w.created_at,
           u.email AS owner_email, u.name AS owner_name,
           wb.address ->> 'accountType' AS account_type,
           wb.address ->> 'planStatus' AS plan_status,
           (SELECT count(*)::int FROM clients c WHERE c.workspace_id = w.id) AS client_count
    FROM workspaces w
    JOIN users u ON u.id = w.owner_id
    LEFT JOIN workspace_billing wb ON wb.workspace_id = w.id
    WHERE w.id = ${workspaceId}
    LIMIT 1
  `) as Row[];
  const base = rows[0];
  if (!base) return null;

  const clients = (await sql()`
    SELECT id, name, created_at FROM clients
    WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC
  `) as { id: string; name: string; created_at: string | Date }[];

  const posts = (await sql()`
    SELECT count(*)::int AS c FROM social_posts WHERE workspace_id = ${workspaceId}
  `) as { c: number }[];

  const inv = (await sql()`
    SELECT count(*)::int AS c, COALESCE(sum(total_cents), 0)::int AS total
    FROM invoices WHERE workspace_id = ${workspaceId}
  `) as { c: number; total: number }[];

  return {
    ...toRow(base),
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: new Date(c.created_at).toISOString(),
    })),
    postCount: Number(posts[0]?.c ?? 0),
    invoiceCount: Number(inv[0]?.c ?? 0),
    invoiceTotalCents: Number(inv[0]?.total ?? 0),
  };
}

// ---------- Staff audit trail (Neon; see 0013_admin_audit.sql) ----------

export interface AdminAuditRow {
  id: string;
  actorName: string;
  workspaceName: string | null;
  action: string;
  target: string | null;
  createdAt: string;
}

/** Record a staff action. Never throws — a missing audit table (0013 not yet
 *  run) or a write error must not block the action itself. */
export async function logAdminAudit(input: {
  actorEmail: string;
  action: string;
  workspaceId?: string | null;
  detail?: string | null;
}): Promise<void> {
  if (!hasDb()) return;
  try {
    await sql()`
      INSERT INTO admin_audit (id, actor_email, action, workspace_id, detail)
      VALUES (${crypto.randomUUID()}, ${input.actorEmail}, ${input.action},
              ${input.workspaceId ?? null}, ${input.detail ?? null})
    `;
  } catch {
    /* table not present yet, or transient error — auditing must never block. */
  }
}

/** Read the staff audit log, newest first, with the acted-on workspace name. */
export async function listAdminAudit(limit = 200): Promise<AdminAuditRow[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql()`
      SELECT a.id, a.actor_email, a.action, a.detail, a.created_at,
             w.name AS workspace_name
      FROM admin_audit a
      LEFT JOIN workspaces w ON w.id = a.workspace_id
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `) as {
      id: string;
      actor_email: string;
      action: string;
      detail: string | null;
      created_at: string | Date;
      workspace_name: string | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      actorName: r.actor_email,
      workspaceName: r.workspace_name,
      action: r.action,
      target: r.detail,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  } catch {
    return [];
  }
}
