/**
 * Usage & entitlement enforcement.
 *
 * Reads the per-plan config from lib/stripe/plans.ts and answers "is this
 * workspace allowed to …?" — feature flags plus numeric caps (messages/mo,
 * knowledge-base size, team seats). The dashboard uses these to gate UI; the
 * public chat path uses withinMessageCap to enforce the monthly allowance.
 */

import { PLANS, minPlanFor, type PlanFlag } from "@/lib/stripe/plans";
import type { Plan } from "@/lib/data/types";

/** Whether the plan unlocks a premium feature. */
export function hasFeature(plan: Plan, flag: PlanFlag): boolean {
  return PLANS[plan].flags[flag];
}

/** The plan a workspace must upgrade to for a feature it doesn't have (or null). */
export function upgradeTargetFor(plan: Plan, flag: PlanFlag): Plan | null {
  return hasFeature(plan, flag) ? null : minPlanFor(flag);
}

// ---------- Knowledge base (enforced in characters, shown in pages) ----------

/** ~1 page ≈ 500 words ≈ 2,500 chars — keep in sync with plans.ts. */
const CHARS_PER_PAGE = 2500;

export function charsToPages(chars: number): number {
  return Math.max(0, Math.round(chars / CHARS_PER_PAGE));
}

/** Can we add `addChars` of knowledge without exceeding the plan's KB limit? */
export function canAddKnowledge(
  plan: Plan,
  usedChars: number,
  addChars: number,
): boolean {
  return usedChars + Math.max(0, addChars) <= PLANS[plan].kbCharLimit;
}

export function kbUsage(plan: Plan, usedChars: number) {
  const limitChars = PLANS[plan].kbCharLimit;
  return {
    usedPages: charsToPages(usedChars),
    limitPages: PLANS[plan].kbPages,
    usedChars,
    limitChars,
    remainingChars: Math.max(0, limitChars - usedChars),
    over: usedChars > limitChars,
  };
}

// ---------- Messages ----------

export function withinMessageCap(plan: Plan, used: number): boolean {
  return used < PLANS[plan].messagesPerMonth;
}

export function messageUsage(plan: Plan, used: number) {
  const limit = PLANS[plan].messagesPerMonth;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    over: used >= limit,
  };
}

// ---------- Team seats ----------

export function withinSeatCap(plan: Plan, currentSeats: number): boolean {
  return currentSeats < PLANS[plan].teamSeats;
}

export function seatUsage(plan: Plan, currentSeats: number) {
  const limit = PLANS[plan].teamSeats;
  return {
    used: currentSeats,
    limit,
    remaining: Math.max(0, limit - currentSeats),
    atCapacity: currentSeats >= limit,
  };
}
