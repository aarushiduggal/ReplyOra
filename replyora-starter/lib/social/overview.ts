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

/**
 * Real dashboard overview aggregated across every client in the workspace.
 * Iterates clients (small N for an agency) and folds their posts, invoices and
 * approvals into headline counts + a recent-activity timeline. Each per-client
 * fetch is guarded so one bad client never blanks the whole dashboard.
 */
export async function getStudioOverview(): Promise<StudioOverview> {
  const clients = await listClients();
  const stats: OverviewStats = {
    clients: clients.length,
    scheduled: 0,
    inReview: 0,
    published: 0,
    outstandingCents: 0,
  };
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

      // Recent posts → timeline entries
      for (const p of posts.slice(0, 4)) {
        const kind: ActivityKind =
          p.status === "published"
            ? "published"
            : p.status === "scheduled"
              ? "scheduled"
              : "draft";
        const verb =
          kind === "published"
            ? "Published a post for"
            : kind === "scheduled"
              ? "Scheduled a post for"
              : "Drafted a post for";
        activity.push({
          kind,
          text: `${verb} ${c.name}`,
          at: p.scheduledFor ?? p.createdAt ?? "",
          clientId: c.id,
        });
      }

      // Recent invoices → timeline entries
      for (const inv of invoices.slice(0, 2)) {
        activity.push({
          kind: "invoice",
          text: `Invoice ${inv.number} ${inv.status} · ${c.name}`,
          at: inv.issuedAt ?? "",
          clientId: c.id,
        });
      }
    }),
  );

  activity.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

  return { stats, activity: activity.slice(0, 6) };
}
