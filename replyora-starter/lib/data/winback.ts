import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

/**
 * Win-Back Agent — the outbound engine.
 *
 * Unlike Recovery (which nudges *inbound* visitors who dropped a chat/booking),
 * the Win-Back Agent watches a business's existing CUSTOMER LIST and finds
 * people who are overdue to come back — a physio patient who never rebooked,
 * a salon client past their usual cycle, a gym member who's gone quiet. It
 * drafts an on-brand message per customer into a review queue; the owner
 * approves (or edits) and it "sends".
 *
 * MOCK vs LIVE: identical to the rest of lib/data — live mode returns empty
 * (a real signed-in workspace reads its own, initially empty, data) while the
 * demo seed powers local dev. // TODO: Supabase tables + a scheduled sweep job.
 */

export type Vertical = "physio" | "salon" | "gym";

export type WinbackStatus =
  | "overdue" // detected, draft ready, awaiting approval
  | "sent" // approved and messaged
  | "rebooked" // customer came back — the win
  | "snoozed"; // owner deferred this one

export interface WinbackCustomer {
  id: string;
  name: string;
  phone: string;
  vertical: Vertical;
  /** Demo business the customer belongs to (drives message signature). */
  business: string;
  /** Their last service/visit. */
  lastService: string;
  lastVisit: string; // ISO
  /** Expected weeks between visits for this service — the overdue threshold. */
  cadenceWeeks: number;
  /** Typical value of one recovered visit, in AUD. */
  avgSpend: number;
  status: WinbackStatus;
  /** The current draft message (editable in the queue). */
  draft: string;
}

// ---------------------------------------------------------------------------
// Overdue maths
// ---------------------------------------------------------------------------

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksSince(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / MS_PER_WEEK);
}

/** How many weeks past their expected cadence this customer is (>=0). */
export function weeksOverdue(c: WinbackCustomer, now: Date = new Date()): number {
  return Math.max(0, weeksSince(c.lastVisit, now) - c.cadenceWeeks);
}

// ---------------------------------------------------------------------------
// Message drafting (deterministic "AI" — swap for a real LLM call in live)
// ---------------------------------------------------------------------------

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Compose an on-brand win-back message. `variant` lets the "Regenerate" button
 * offer an alternate take without a real model call in the prototype.
 * // TODO: replace with lib/ai/llm.ts using the workspace's brand voice.
 */
export function draftMessage(
  c: Pick<
    WinbackCustomer,
    "name" | "vertical" | "business" | "lastService"
  > & { weeksOverdue: number },
  variant: 0 | 1 = 0,
): string {
  const n = firstName(c.name);
  const w = c.weeksOverdue;
  const wk = w === 1 ? "week" : "weeks";

  if (c.vertical === "physio") {
    return variant === 0
      ? `Hi ${n}, it's the team at ${c.business}. It's been about ${w} ${wk} since your ${c.lastService} — how's everything holding up? If any of those symptoms have crept back, it's worth finishing off the plan so the progress sticks. Want me to hold a time for you this week? Reply YES and I'll lock it in.`
      : `Hi ${n} — ${c.business} here. We don't want your ${c.lastService} progress to slide. You're due for a check-in (it's been ${w} ${wk}). I've got a couple of spots this week — reply YES and I'll book you the soonest one.`;
  }

  if (c.vertical === "salon") {
    return variant === 0
      ? `Hi ${n}! We've been missing you at ${c.business}. You're about due for your ${c.lastService} — want me to save your usual spot this week? Reply YES and it's yours.`
      : `Hey ${n}, it's ${c.business}. It's been ${w} ${wk} since your last ${c.lastService} and we'd love to get you back in the chair. I can hold a time for you — just reply YES.`;
  }

  // gym
  return variant === 0
    ? `Hey ${n} — noticed we haven't seen you at ${c.business} in ${w} ${wk}. Life gets busy! Your spot's still here whenever you're ready. Want me to book a quick session this week to get back in the groove? Reply YES and I'll sort it.`
    : `Hi ${n}, ${c.business} here. Getting back after a break is the hardest part — so let's make it easy. Reply YES and I'll book you a session this week, no pressure.`;
}

// ---------------------------------------------------------------------------
// Demo seed — one business per vertical, anchored to ~mid-2026
// ---------------------------------------------------------------------------

function withDraft(
  c: Omit<WinbackCustomer, "draft">,
  now: Date,
): WinbackCustomer {
  return {
    ...c,
    draft: draftMessage(
      { ...c, weeksOverdue: Math.max(0, weeksSince(c.lastVisit, now) - c.cadenceWeeks) },
      0,
    ),
  };
}

function seed(now: Date): WinbackCustomer[] {
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const raw: Omit<WinbackCustomer, "draft">[] = [
    // ---- Physio: Movement Physio (cadence ~3 weeks on an active plan) ----
    { id: "wb_p1", name: "Daniel Kwon", phone: "+61 412 004 118", vertical: "physio", business: "Movement Physio", lastService: "lower-back rehab session", lastVisit: daysAgo(42), cadenceWeeks: 3, avgSpend: 95, status: "overdue" },
    { id: "wb_p2", name: "Priya Nair", phone: "+61 401 552 907", vertical: "physio", business: "Movement Physio", lastService: "post-op knee session", lastVisit: daysAgo(56), cadenceWeeks: 3, avgSpend: 110, status: "overdue" },
    { id: "wb_p3", name: "Marcus Webb", phone: "+61 423 771 003", vertical: "physio", business: "Movement Physio", lastService: "shoulder assessment", lastVisit: daysAgo(35), cadenceWeeks: 3, avgSpend: 95, status: "overdue" },
    { id: "wb_p4", name: "Aisha Rahman", phone: "+61 438 220 641", vertical: "physio", business: "Movement Physio", lastService: "sports-injury session", lastVisit: daysAgo(63), cadenceWeeks: 3, avgSpend: 95, status: "sent" },
    { id: "wb_p5", name: "Tom Fielding", phone: "+61 402 889 314", vertical: "physio", business: "Movement Physio", lastService: "gait & running review", lastVisit: daysAgo(28), cadenceWeeks: 3, avgSpend: 130, status: "rebooked" },

    // ---- Salon: Coastal Glow (cadence ~5 weeks) ----
    { id: "wb_s1", name: "Hannah Lee", phone: "+61 414 663 220", vertical: "salon", business: "Coastal Glow", lastService: "colour & cut", lastVisit: daysAgo(63), cadenceWeeks: 5, avgSpend: 185, status: "overdue" },
    { id: "wb_s2", name: "Grace Miller", phone: "+61 431 907 552", vertical: "salon", business: "Coastal Glow", lastService: "balayage", lastVisit: daysAgo(84), cadenceWeeks: 6, avgSpend: 240, status: "overdue" },
    { id: "wb_s3", name: "Olivia Brennan", phone: "+61 405 118 730", vertical: "salon", business: "Coastal Glow", lastService: "blow-dry & treatment", lastVisit: daysAgo(49), cadenceWeeks: 5, avgSpend: 95, status: "overdue" },
    { id: "wb_s4", name: "Sophie Turner", phone: "+61 402 661 049", vertical: "salon", business: "Coastal Glow", lastService: "cut & style", lastVisit: daysAgo(70), cadenceWeeks: 5, avgSpend: 120, status: "sent" },
    { id: "wb_s5", name: "Renee Adams", phone: "+61 439 550 187", vertical: "salon", business: "Coastal Glow", lastService: "colour refresh", lastVisit: daysAgo(45), cadenceWeeks: 5, avgSpend: 165, status: "rebooked" },

    // ---- Gym: Ironline Fitness (lapsed if quiet ~2+ weeks) ----
    { id: "wb_g1", name: "Jake Sullivan", phone: "+61 412 330 771", vertical: "gym", business: "Ironline Fitness", lastService: "PT session", lastVisit: daysAgo(28), cadenceWeeks: 1, avgSpend: 70, status: "overdue" },
    { id: "wb_g2", name: "Emily Zhao", phone: "+61 401 664 209", vertical: "gym", business: "Ironline Fitness", lastService: "class pack", lastVisit: daysAgo(35), cadenceWeeks: 1, avgSpend: 65, status: "overdue" },
    { id: "wb_g3", name: "Ben Carter", phone: "+61 423 118 990", vertical: "gym", business: "Ironline Fitness", lastService: "membership check-in", lastVisit: daysAgo(21), cadenceWeeks: 1, avgSpend: 65, status: "overdue" },
    { id: "wb_g4", name: "Maya Cole", phone: "+61 438 771 205", vertical: "gym", business: "Ironline Fitness", lastService: "PT session", lastVisit: daysAgo(42), cadenceWeeks: 1, avgSpend: 70, status: "sent" },
  ];

  return raw.map((c) => withDraft(c, now));
}

// Module-level mutable store so status changes persist across a dev session
// (mirrors lib/data/growth.ts). Rebuilt lazily against a stable "now".
const NOW = new Date();
const STORE: WinbackCustomer[] = seed(NOW);

// ---------------------------------------------------------------------------
// Accessors (workspace-scoped; empty in live until real tables exist)
// ---------------------------------------------------------------------------

async function scoped(): Promise<WinbackCustomer[]> {
  await getCurrentWorkspaceId();
  return USE_SUPABASE ? [] : STORE;
}

export interface WinbackStats {
  overdue: number;
  queuedValue: number; // potential revenue sitting in the overdue queue
  sentThisRound: number;
  rebooked: number;
  revenueRecovered: number; // realised from rebooked customers
  /** Illustrative: value recoverable at a 30% reactivation rate. */
  projectedRecovery: number;
}

/** Optionally filter to a single vertical. */
export async function getWinbackCustomers(
  vertical?: Vertical,
): Promise<WinbackCustomer[]> {
  const rows = await scoped();
  const list = vertical ? rows.filter((c) => c.vertical === vertical) : rows;
  // Overdue first, then by how overdue (most urgent on top).
  const rank: Record<WinbackStatus, number> = {
    overdue: 0,
    sent: 1,
    snoozed: 2,
    rebooked: 3,
  };
  return [...list].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] || weeksOverdue(b, NOW) - weeksOverdue(a, NOW),
  );
}

export async function getWinbackStats(
  vertical?: Vertical,
): Promise<WinbackStats> {
  const rows = await scoped();
  const list = vertical ? rows.filter((c) => c.vertical === vertical) : rows;
  const overdue = list.filter((c) => c.status === "overdue");
  const queuedValue = overdue.reduce((s, c) => s + c.avgSpend, 0);
  const rebooked = list.filter((c) => c.status === "rebooked");
  return {
    overdue: overdue.length,
    queuedValue,
    sentThisRound: list.filter((c) => c.status === "sent").length,
    rebooked: rebooked.length,
    revenueRecovered: rebooked.reduce((s, c) => s + c.avgSpend, 0),
    projectedRecovery: Math.round(queuedValue * 0.3),
  };
}

// ---------------------------------------------------------------------------
// Mutations (in-memory; the server actions call these)
// ---------------------------------------------------------------------------

export function setWinbackStatus(id: string, status: WinbackStatus): void {
  const c = STORE.find((x) => x.id === id);
  if (c) c.status = status;
}

export function setWinbackDraft(id: string, draft: string): void {
  const c = STORE.find((x) => x.id === id);
  if (c) c.draft = draft;
}

/** Produce an alternate draft (variant toggle) for the Regenerate button. */
export function regenerateWinbackDraft(id: string): string | null {
  const c = STORE.find((x) => x.id === id);
  if (!c) return null;
  const next = draftMessage(
    { ...c, weeksOverdue: weeksOverdue(c, NOW) },
    1,
  );
  c.draft = next;
  return next;
}
