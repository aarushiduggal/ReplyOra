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
  };
}

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  if (!hasDb()) return [];
  const rows = (await sql()`
    SELECT w.id, w.name, w.created_at,
           u.email AS owner_email, u.name AS owner_name,
           wb.address ->> 'accountType' AS account_type,
           wb.address ->> 'planStatus' AS plan_status,
           (SELECT count(*)::int FROM clients c WHERE c.workspace_id = w.id) AS client_count
    FROM workspaces w
    JOIN users u ON u.id = w.owner_id
    LEFT JOIN workspace_billing wb ON wb.workspace_id = w.id
    ORDER BY w.created_at DESC
  `) as Row[];
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
