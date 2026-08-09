import { listWorkspaces } from "@/lib/admin/social-data";
import { DEMO_AGENCIES } from "@/lib/admin/demo";
import type { SocialAddons, SocialPlan } from "@/lib/social/plans";
import { CLIENT_LIMIT, SOCIAL_PLAN_PRICE, CHATBOX_ADDON_PRICE } from "@/lib/social/plans";

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
  const base = SOCIAL_PLAN_PRICE[accountType]?.monthly ?? SOCIAL_PLAN_PRICE.personal.monthly;
  // Chatbox add-on ($39/mo) unless Agency (includes 1 free).
  const chatbox = addons.chatbox && accountType !== "agency" ? CHATBOX_ADDON_PRICE : 0;
  return base + chatbox;
}

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
  const studio = paying.filter((a) => a.accountType === "studio");
  const agency = paying.filter((a) => a.accountType === "agency");
  // Chatbox add-on is only billed for non-Agency plans (Agency includes 1 free).
  const chatbox = paying.filter((a) => a.addons.chatbox && a.accountType !== "agency");
  const P = SOCIAL_PLAN_PRICE;
  const revenue: RevenueLine[] = [
    { key: "personal", label: `Personal ($${P.personal.monthly})`, count: personal.length, mrr: personal.length * P.personal.monthly },
    { key: "studio", label: `Studio ($${P.studio.monthly})`, count: studio.length, mrr: studio.length * P.studio.monthly },
    { key: "agency", label: `Agency ($${P.agency.monthly})`, count: agency.length, mrr: agency.length * P.agency.monthly },
    { key: "chatbox", label: `Chatbox add-on ($${CHATBOX_ADDON_PRICE})`, count: chatbox.length, mrr: chatbox.length * CHATBOX_ADDON_PRICE },
  ];

  return { agencies, kpis, attention: buildAttention(agencies), revenue };
}

export interface AgencyBrand {
  id: string;
  name: string;
  createdAt: string;
}
export interface AgencyDetail extends AgencySummary {
  brandList: AgencyBrand[];
}

const DEMO_BRAND_POOL = [
  "Bloom Hair Studio", "Rosewood Skin", "Lumen Cafe", "Harbour Dental",
  "Coastal Pilates", "Ember Interiors", "Sol Swimwear", "Fern & Field",
  "Wilder Florals", "Amara Beauty", "Nara Yoga", "Halcyon Homewares",
];

/** Rich single-agency view for the staff console. Mock = seeded; Neon = real. */
export async function getAgencyDetail(id: string): Promise<AgencyDetail | null> {
  if (!hasDb()) {
    const a = DEMO_AGENCIES.find((x) => x.id === id);
    if (!a) return null;
    const brandList: AgencyBrand[] = Array.from({ length: a.brands }, (_, i) => ({
      id: `${id}_brand_${i}`,
      name: DEMO_BRAND_POOL[i % DEMO_BRAND_POOL.length] ?? `Brand ${i + 1}`,
      createdAt: new Date(
        new Date(a.createdAt).getTime() + i * 3 * 86400000,
      ).toISOString(),
    }));
    return { ...a, brandList };
  }

  const { getWorkspaceDetail } = await import("@/lib/admin/social-data");
  const d = await getWorkspaceDetail(id);
  if (!d) return null;
  const accountType: SocialPlan =
    d.accountType === "agency" ? "agency" : d.accountType === "studio" ? "studio" : "personal";
  const status: AgencyStatus =
    d.planStatus === "active"
      ? "active"
      : d.planStatus === "past_due"
        ? "past_due"
        : d.planStatus === "canceled"
          ? "canceled"
          : "trialing";
  const addons: SocialAddons = { chatbox: false, reports: false };
  return {
    id: d.id,
    name: d.name,
    ownerName: d.ownerName ?? d.ownerEmail.split("@")[0] ?? "Owner",
    ownerEmail: d.ownerEmail,
    accountType,
    status,
    addons,
    brands: d.clientCount,
    postsThisMonth: d.postCount,
    mrr: mrrFor(accountType, addons),
    createdAt: d.createdAt,
    lastActiveDays: 0,
    trialEndsInDays: status === "trialing" ? 5 : null,
    brandList: d.clients,
  };
}

/** Everything the staff god-view needs. Mock = seeded agencies; Neon = real. */
export async function getAdminOverview(): Promise<AdminOverviewData> {
  if (!hasDb()) return summarize(DEMO_AGENCIES);

  const rows = await listWorkspaces();
  const agencies: AgencySummary[] = rows.map((w) => {
    const accountType: SocialPlan =
      w.accountType === "agency" ? "agency" : w.accountType === "studio" ? "studio" : "personal";
    const status: AgencyStatus =
      w.planStatus === "active"
        ? "active"
        : w.planStatus === "past_due"
          ? "past_due"
          : w.planStatus === "canceled"
            ? "canceled"
            : "trialing";
    const addons: SocialAddons = w.addons;
    // The trial is 7 days from signup; compute days left from created_at.
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(w.createdAt).getTime()) / 86_400_000,
    );
    const trialEndsInDays = status === "trialing" ? Math.max(0, 7 - daysSinceSignup) : null;
    return {
      id: w.id,
      name: w.name,
      ownerName: w.ownerName ?? w.ownerEmail.split("@")[0] ?? "Owner",
      ownerEmail: w.ownerEmail,
      accountType,
      status,
      addons,
      brands: w.clientCount,
      postsThisMonth: w.postsThisMonth,
      mrr: mrrFor(accountType, addons),
      createdAt: w.createdAt,
      lastActiveDays: daysSinceSignup,
      trialEndsInDays,
    };
  });
  return summarize(agencies);
}
