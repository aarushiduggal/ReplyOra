import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { listClients } from "./clients";
import { listClientPosts } from "./posts";
import { listClientInvoices } from "./invoices";
import { getClientApprovals } from "./approvals";
import { approvalCounts } from "./portal";

/** At-a-glance counts for the studio cockpit. */
export interface OverviewStats {
  clients: number;
  scheduled: number;
  inReview: number;
  published: number;
  outstandingCents: number;
}

export type ActivityKind =
  | "scheduled"
  | "published"
  | "approved"
  | "invoice"
  | "draft";

export interface ActivityItem {
  kind: ActivityKind;
  text: string;
  /** ISO timestamp (may be empty when unknown) */
  at: string;
  clientId: string;
}

export interface StudioOverview {
  stats: OverviewStats;
  activity: ActivityItem[];
}

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

/**
 * Real dashboard overview aggregated across every client in the workspace.
 *
 * Uses a handful of workspace-wide aggregate/limited queries (constant number
 * of round-trips regardless of client count) instead of the old per-client
 * fan-out (3+ queries × N clients), which gated the landing screen behind
 * dozens of serverless calls. Falls back to the per-client path only in the
 * no-DB dev/memory mode.
 */
export async function getStudioOverview(): Promise<StudioOverview> {
  const clients = await listClients();
  const nameById = new Map(clients.map((c) => [c.id, c.name]));
  const stats: OverviewStats = {
    clients: clients.length,
    scheduled: 0,
    inReview: 0,
    published: 0,
    outstandingCents: 0,
  };

  if (!hasDb()) return devOverview(clients, stats);

  const workspaceId = await getCurrentWorkspaceId();
  type CountRow = { status: string; n: number };
  type SumRow = { outstanding: number };
  type PostRow = { client_id: string; status: string; scheduled_for: string | null; created_at: string | null };
  type InvRow = { client_id: string; number: string; status: string; issued_at: string | null };

  const [postCounts, outstanding, pendingApprovals, recentPosts, recentInvoices] =
    await Promise.all([
      (sql()`
        SELECT status, COUNT(*)::int AS n FROM social_posts
        WHERE workspace_id = ${workspaceId} GROUP BY status
      `).catch(() => [] as CountRow[]),
      (sql()`
        SELECT COALESCE(SUM(total_cents), 0)::int AS outstanding FROM invoices
        WHERE workspace_id = ${workspaceId} AND status IN ('sent', 'overdue')
      `).catch(() => [{ outstanding: 0 }] as SumRow[]),
      (sql()`
        SELECT COUNT(*)::int AS n FROM approvals a
        JOIN social_posts p ON p.id = a.post_id
        WHERE p.workspace_id = ${workspaceId} AND a.status = 'pending'
      `).catch(() => [{ n: 0 }] as { n: number }[]),
      (sql()`
        SELECT client_id, status, scheduled_for, created_at FROM social_posts
        WHERE workspace_id = ${workspaceId}
        ORDER BY COALESCE(scheduled_for, created_at) DESC NULLS LAST
        LIMIT 8
      `).catch(() => [] as PostRow[]),
      (sql()`
        SELECT client_id, number, status, issued_at FROM invoices
        WHERE workspace_id = ${workspaceId}
        ORDER BY issued_at DESC NULLS LAST
        LIMIT 6
      `).catch(() => [] as InvRow[]),
    ]);

  for (const r of postCounts as CountRow[]) {
    if (r.status === "scheduled") stats.scheduled = r.n;
    else if (r.status === "published") stats.published = r.n;
  }
  stats.outstandingCents = (outstanding as SumRow[])[0]?.outstanding ?? 0;
  stats.inReview = (pendingApprovals as { n: number }[])[0]?.n ?? 0;

  const activity: ActivityItem[] = [];
  for (const p of recentPosts as PostRow[]) {
    const kind: ActivityKind =
      p.status === "published" ? "published" : p.status === "scheduled" ? "scheduled" : "draft";
    const verb =
      kind === "published" ? "Published a post for"
      : kind === "scheduled" ? "Scheduled a post for"
      : "Drafted a post for";
    const name = nameById.get(p.client_id) ?? "a client";
    activity.push({ kind, text: `${verb} ${name}`, at: p.scheduled_for ?? p.created_at ?? "", clientId: p.client_id });
  }
  for (const inv of recentInvoices as InvRow[]) {
    const name = nameById.get(inv.client_id) ?? "a client";
    activity.push({ kind: "invoice", text: `Invoice ${inv.number} ${inv.status} · ${name}`, at: inv.issued_at ?? "", clientId: inv.client_id });
  }
  activity.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

  return { stats, activity: activity.slice(0, 6) };
}

/** No-DB dev/memory path — small N, in-memory, so the per-client loop is fine. */
async function devOverview(
  clients: { id: string; name: string }[],
  stats: OverviewStats,
): Promise<StudioOverview> {
  const activity: ActivityItem[] = [];
  await Promise.all(
    clients.map(async (c) => {
      const [posts, invoices, approvals] = await Promise.all([
        listClientPosts(c.id).catch(() => []),
        listClientInvoices(c.id).catch(() => []),
        getClientApprovals(c.id).catch(() => new Map()),
      ]);
      for (const p of posts) {
        if (p.status === "scheduled") stats.scheduled += 1;
        else if (p.status === "published") stats.published += 1;
      }
      const appr = await approvalCounts(approvals);
      stats.inReview += appr.pending;
      for (const inv of invoices) {
        if (inv.status === "sent" || inv.status === "overdue") {
          stats.outstandingCents += inv.totalCents ?? 0;
        }
      }
      for (const p of posts.slice(0, 4)) {
        const kind: ActivityKind =
          p.status === "published" ? "published" : p.status === "scheduled" ? "scheduled" : "draft";
        const verb =
          kind === "published" ? "Published a post for"
          : kind === "scheduled" ? "Scheduled a post for"
          : "Drafted a post for";
        activity.push({ kind, text: `${verb} ${c.name}`, at: p.scheduledFor ?? p.createdAt ?? "", clientId: c.id });
      }
      for (const inv of invoices.slice(0, 2)) {
        activity.push({ kind: "invoice", text: `Invoice ${inv.number} ${inv.status} · ${c.name}`, at: inv.issuedAt ?? "", clientId: c.id });
      }
    }),
  );
  activity.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return { stats, activity: activity.slice(0, 6) };
}
