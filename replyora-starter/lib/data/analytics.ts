import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import {
  DEMO_BUSINESS_PROFILE,
  DEMO_CONVERSATIONS,
  DEMO_LEADS,
} from "./seed";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Where on the website conversations start (Replyora is a website widget). */
export interface PageStat {
  label: string;
  conversations: number;
  leads: number;
}

export interface TrendPoint {
  label: string;
  conversations: number;
  leads: number;
}

export interface Analytics {
  funnel: { visitors: number; conversations: number; leads: number; booked: number };
  conversionRate: number; // leads / conversations
  bookingRate: number; // booked / leads
  avgResponseSeconds: number;
  afterHoursLeads: number;
  afterHoursPct: number;
  topPages: PageStat[];
  trend: TrendPoint[];
}

/** Shorten a page URL to a readable path label, e.g. "/treatments/laser". */
function pageLabel(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path === "/" || path === "" ? "Home" : path;
  } catch {
    return url || "Home";
  }
}

/** Is an ISO timestamp outside the clinic's opening hours? */
function isAfterHours(iso: string): boolean {
  const d = new Date(iso);
  const key = DAY_KEYS[d.getDay()]!;
  const h = DEMO_BUSINESS_PROFILE.hours[key];
  if (!h || h.closed || !h.open) return true;
  const hour = d.getHours();
  const open = Number(h.open.split(":")[0]);
  const close = Number((h.close || "17:00").split(":")[0]);
  return hour < open || hour >= close;
}

/**
 * Aggregate funnel + top-pages + time analytics from the mock data.
 * // TODO: replace with Supabase aggregate queries / a metrics rollup.
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function getAnalytics(): Promise<Analytics> {
  await getCurrentWorkspaceId();

  // Live: a new workspace has no data yet. // TODO: real metric rollups (Phase C).
  if (USE_SUPABASE) {
    return {
      funnel: { visitors: 0, conversations: 0, leads: 0, booked: 0 },
      conversionRate: 0,
      bookingRate: 0,
      avgResponseSeconds: 0,
      afterHoursLeads: 0,
      afterHoursPct: 0,
      topPages: [],
      trend: WEEKDAYS.map((label) => ({ label, conversations: 0, leads: 0 })),
    };
  }

  const conversations = DEMO_CONVERSATIONS.length;
  const leads = DEMO_LEADS.length;
  const booked = DEMO_LEADS.filter((l) => l.status === "booked").length;
  const visitors = Math.round(conversations * 6.4); // mock visitor:chat ratio

  const afterHoursLeads = DEMO_LEADS.filter((l) =>
    isAfterHours(l.createdAt),
  ).length;

  // Top pages where conversations start (website widget).
  const pageMap = new Map<string, PageStat>();
  for (const c of DEMO_CONVERSATIONS) {
    const label = pageLabel(c.pageUrl);
    const stat = pageMap.get(label) ?? { label, conversations: 0, leads: 0 };
    stat.conversations += 1;
    if (c.capturedLead) stat.leads += 1;
    pageMap.set(label, stat);
  }
  const topPages = [...pageMap.values()]
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 5);

  // Last 7 days trend (deterministic mock shaped from the seed totals).
  const shape = [2, 3, 1, 4, 3, 5, 4];
  const trend: TrendPoint[] = shape.map((n, i) => ({
    label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]!,
    conversations: n,
    leads: Math.max(0, Math.round(n * 0.55)),
  }));

  return {
    funnel: { visitors, conversations, leads, booked },
    conversionRate: conversations ? leads / conversations : 0,
    bookingRate: leads ? booked / leads : 0,
    avgResponseSeconds: 4,
    afterHoursLeads,
    afterHoursPct: leads ? afterHoursLeads / leads : 0,
    topPages,
    trend,
  };
}
