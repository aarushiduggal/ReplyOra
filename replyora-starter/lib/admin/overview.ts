import { listWorkspaces } from "@/lib/admin/social-data";
import { DEMO_AGENCIES } from "@/lib/admin/demo";
import type { SocialAddons, SocialPlan } from "@/lib/social/plans";

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

export type AgencyStatus = "trialing" | "active" | "past_due" | "canceled";

/** One paying customer (workspace) as the staff god-view sees it. */
export interface AgencySummary {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  accountType: SocialPlan; // personal | agency
  status: AgencyStatus;
  addons: SocialAddons;
  brands: number; // client count
  postsThisMonth: number;
  mrr: number; // AUD/mo
  createdAt: string; // ISO
  lastActiveDays: number; // days since last activity
  trialEndsInDays: number | null;
}

export interface AdminKpis {
  agencies: number;
  activeAgencies: number;
  trialing: number;
  pastDue: number;
  brands: number;
  postsThisMonth: number;
  mrr: number;
  arr: number;
  newThisWeek: number;
}

export type AttentionKind = "trial" | "billing" | "limit" | "inactive";
export type AttentionSeverity = "high" | "medium" | "low";
export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: AttentionSeverity;
  label: string;
  href: string;
}

export interface RevenueLine {
  key: string;
  label: string;
  count: number;
  mrr: number;
}

export interface AdminOverviewData {
  agencies: AgencySummary[];
  kpis: AdminKpis;
  attention: AttentionItem[];
  revenue: RevenueLine[];
}

/** Monthly price for a plan + add-ons (mirrors the marketing pricing). */
export function mrrFor(accountType: SocialPlan, addons: SocialAddons): number {
  const base = accountType === "agency" ? 200 : 50;
  return base + (addons.chatbox ? 20 : 0) + (addons.reports ? 15 : 0);
}

const CLIENT_LIMIT: Record<SocialPlan, number> = { personal: 1, agency: 10 };

function buildAttention(agencies: AgencySummary[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const a of agencies) {
    const href = `/admin/workspaces/${a.id}`;
    if (a.status === "trialing" && a.trialEndsInDays !== null && a.trialEndsInDays <= 3) {
      items.push({
        id: `trial-${a.id}`,
        kind: "trial",
        severity: a.trialEndsInDays <= 1 ? "high" : "medium",
        label: `${a.name} — trial ends in ${a.trialEndsInDays}d`,
        href,
      });
    }
    if (a.status === "past_due") {
      items.push({
        id: `bill-${a.id}`,
        kind: "billing",
        severity: "high",
        label: `${a.name} — payment overdue`,
        href,
      });
    }
    if (a.brands >= CLIENT_LIMIT[a.accountType]) {
      items.push({
        id: `limit-${a.id}`,
        kind: "limit",
        severity: "low",
        label: `${a.name} — at their ${CLIENT_LIMIT[a.accountType]}-brand limit`,
        href,
      });
    }
    if (a.lastActiveDays >= 14 && a.status === "active") {
      items.push({
        id: `idle-${a.id}`,
        kind: "inactive",
        severity: "medium",
        label: `${a.name} — no activity for ${a.lastActiveDays}d`,
        href,
      });
    }
  }
  const rank: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 };
  return items.sort((x, y) => rank[x.severity] - rank[y.severity]);
}

function summarize(agencies: AgencySummary[]): AdminOverviewData {
  const kpis: AdminKpis = {
    agencies: agencies.length,
    activeAgencies: agencies.filter((a) => a.status === "active").length,
    trialing: agencies.filter((a) => a.status === "trialing").length,
    pastDue: agencies.filter((a) => a.status === "past_due").length,
    brands: agencies.reduce((s, a) => s + a.brands, 0),
    postsThisMonth: agencies.reduce((s, a) => s + a.postsThisMonth, 0),
    mrr: agencies
      .filter((a) => a.status === "active" || a.status === "past_due")
      .reduce((s, a) => s + a.mrr, 0),
    arr: 0,
    newThisWeek: agencies.filter((a) => {
      const days = (Date.now() - new Date(a.createdAt).getTime()) / 86400000;
      return days <= 7;
    }).length,
  };
  kpis.arr = kpis.mrr * 12;

  // Revenue split: base plans + each add-on line.
  const paying = agencies.filter((a) => a.status === "active" || a.status === "past_due");
  const personal = paying.filter((a) => a.accountType === "personal");
  const agency = paying.filter((a) => a.accountType === "agency");
  const chatbox = paying.filter((a) => a.addons.chatbox);
  const reports = paying.filter((a) => a.addons.reports);
  const revenue: RevenueLine[] = [
    { key: "personal", label: "Personal ($50)", count: personal.length, mrr: personal.length * 50 },
    { key: "agency", label: "Agency ($200)", count: agency.length, mrr: agency.length * 200 },
    { key: "chatbox", label: "Chatbox add-on ($20)", count: chatbox.length, mrr: chatbox.length * 20 },
    { key: "reports", label: "Reports add-on ($15)", count: reports.length, mrr: reports.length * 15 },
  ];

  return { agencies, kpis, attention: buildAttention(agencies), revenue };
}

/** Everything the staff god-view needs. Mock = seeded agencies; Neon = real. */
export async function getAdminOverview(): Promise<AdminOverviewData> {
  if (!hasDb()) return summarize(DEMO_AGENCIES);

  const rows = await listWorkspaces();
  const agencies: AgencySummary[] = rows.map((w) => {
    const accountType: SocialPlan = w.accountType === "agency" ? "agency" : "personal";
    const status: AgencyStatus =
      w.planStatus === "active"
        ? "active"
        : w.planStatus === "past_due"
          ? "past_due"
          : w.planStatus === "canceled"
            ? "canceled"
            : "trialing";
    // Real add-on/post detail isn't in the list query yet — safe defaults.
    const addons: SocialAddons = { chatbox: false, reports: false };
    return {
      id: w.id,
      name: w.name,
      ownerName: w.ownerName ?? w.ownerEmail.split("@")[0] ?? "Owner",
      ownerEmail: w.ownerEmail,
      accountType,
      status,
      addons,
      brands: w.clientCount,
      postsThisMonth: 0,
      mrr: mrrFor(accountType, addons),
      createdAt: w.createdAt,
      lastActiveDays: 0,
      trialEndsInDays: status === "trialing" ? 5 : null,
    };
  });
  return summarize(agencies);
}
