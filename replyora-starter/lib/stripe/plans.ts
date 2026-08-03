/**
 * Plans — single source of truth for pricing, limits, feature flags and the
 * done-for-you service commitments. Matches PACKAGES.md exactly.
 *
 * Replyora is a WEBSITE-EMBED widget only — no social/omnichannel/telephony.
 * "Number of assistants" is deliberately NOT a differentiator.
 *
 * Numeric caps are enforced in lib/usage.ts. Knowledge-base size is shown to
 * customers in "pages" (owner-friendly) but enforced internally in characters
 * (~1 page ≈ 500 words ≈ 2,500 chars).
 */

import type { Plan } from "@/lib/data/types";

/** One-time done-for-you setup & training fee on the first invoice of any plan. */
export const SETUP_FEE_AUD = 250;
/** Free trial length before a paid plan is required. */
export const TRIAL_DAYS = 7;
/** Trial message allowance (plan = "none"). */
export const TRIAL_MESSAGE_CAP = 150;

const CHARS_PER_PAGE = 2500;
export const pagesToChars = (pages: number): number => pages * CHARS_PER_PAGE;

/** Premium capabilities, gated per plan. Keys are stable — referenced by usage.ts. */
export interface PlanFlags {
  leadCapture: boolean;
  booking: boolean;
  humanHandoff: boolean;
  removeBranding: boolean;
  abandonedRecovery: boolean;
  // Pro-only
  continuousRetrain: boolean;
  reviewEngine: boolean;
  noShowReduction: boolean;
  leadWinBack: boolean;
}

export type PlanFlag = keyof PlanFlags;

/** Done-for-you service commitments — delivered by us, tracked in the dashboard
 * as reminders/logs, NOT automated product features. */
export interface ServiceCommitment {
  /** Owner-facing description of the update/retrain cadence. */
  updateCadence: string;
  /** Cost of an extra done-for-you update (Starter only), else null. */
  extraUpdateFeeAud: number | null;
  /** Whether we proactively reach out to refresh the assistant. */
  proactiveRefresh: boolean;
  /** Days between performance-review calls, or null if none. */
  performanceCallDays: number | null;
}

export interface PlanConfig {
  key: Plan;
  name: string;
  /** Monthly price in AUD (0 for the trial). */
  priceAud: number;
  setupFeeAud: number;
  mostPopular: boolean;
  tagline: string;
  // ---- numeric caps (enforced in lib/usage.ts) ----
  messagesPerMonth: number;
  /** Owner-facing KB size. */
  kbPages: number;
  /** Internal enforcement limit in characters. */
  kbCharLimit: number;
  teamSeats: number;
  // ---- gating ----
  flags: PlanFlags;
  service: ServiceCommitment;
  /** Env var name holding the Stripe price id (wired when Stripe lands). */
  stripePriceIdEnv: string | null;
}

const NO_FLAGS: PlanFlags = {
  leadCapture: false,
  booking: false,
  humanHandoff: false,
  removeBranding: false,
  abandonedRecovery: false,
  continuousRetrain: false,
  reviewEngine: false,
  noShowReduction: false,
  leadWinBack: false,
};

export const PLANS: Record<Plan, PlanConfig> = {
  // Trial: Growth-level features (minus Pro-only), 150-message cap. Then pay.
  none: {
    key: "none",
    name: "Trial",
    priceAud: 0,
    setupFeeAud: 0,
    mostPopular: false,
    tagline: "7-day free trial",
    messagesPerMonth: TRIAL_MESSAGE_CAP,
    kbPages: 100,
    kbCharLimit: pagesToChars(100),
    teamSeats: 2,
    flags: {
      ...NO_FLAGS,
      leadCapture: true,
      booking: true,
      humanHandoff: true,
      removeBranding: true,
      abandonedRecovery: true,
    },
    service: {
      updateCadence: "Trial — self-serve setup",
      extraUpdateFeeAud: null,
      proactiveRefresh: false,
      performanceCallDays: null,
    },
    stripePriceIdEnv: null,
  },

  starter: {
    key: "starter",
    name: "Starter",
    priceAud: 250,
    setupFeeAud: SETUP_FEE_AUD,
    mostPopular: false,
    tagline: "Set it up right",
    messagesPerMonth: 1000,
    kbPages: 10,
    kbCharLimit: pagesToChars(10),
    teamSeats: 2,
    flags: {
      ...NO_FLAGS,
      leadCapture: true,
    },
    service: {
      updateCadence: "1 done-for-you update / retrain per quarter (reactive)",
      extraUpdateFeeAud: 25,
      proactiveRefresh: false,
      performanceCallDays: null,
    },
    stripePriceIdEnv: "STRIPE_PRICE_STARTER",
  },

  growth: {
    key: "growth",
    name: "Growth",
    priceAud: 300,
    setupFeeAud: SETUP_FEE_AUD,
    mostPopular: true,
    tagline: "Kept fresh",
    messagesPerMonth: 5000,
    kbPages: 100,
    kbCharLimit: pagesToChars(100),
    teamSeats: 3,
    flags: {
      ...NO_FLAGS,
      leadCapture: true,
      booking: true,
      humanHandoff: true,
      removeBranding: true,
      abandonedRecovery: true,
    },
    service: {
      updateCadence: "Proactive 90-day refresh (we reach out & retrain)",
      extraUpdateFeeAud: null,
      proactiveRefresh: true,
      performanceCallDays: 90,
    },
    stripePriceIdEnv: "STRIPE_PRICE_GROWTH",
  },

  pro: {
    key: "pro",
    name: "Pro",
    priceAud: 390,
    setupFeeAud: SETUP_FEE_AUD,
    mostPopular: false,
    tagline: "Fully managed",
    messagesPerMonth: 20000,
    kbPages: 500,
    kbCharLimit: pagesToChars(500),
    teamSeats: 5,
    flags: {
      leadCapture: true,
      booking: true,
      humanHandoff: true,
      removeBranding: true,
      abandonedRecovery: true,
      continuousRetrain: true,
      reviewEngine: true,
      noShowReduction: true,
      leadWinBack: true,
    },
    service: {
      updateCadence: "Update anytime — priority turnaround",
      extraUpdateFeeAud: null,
      proactiveRefresh: true,
      performanceCallDays: 60,
    },
    stripePriceIdEnv: "STRIPE_PRICE_PRO",
  },
};

/** Paid plans in display order (excludes the trial). */
export const PAID_PLANS: Plan[] = ["starter", "growth", "pro"];

/** Owner-facing labels for each premium feature (used in upsell UI). */
export const FEATURE_LABELS: Record<PlanFlag, string> = {
  leadCapture: "Lead capture & qualification",
  booking: "Booking & calendar",
  humanHandoff: "Human handoff",
  removeBranding: "Remove Replyora branding",
  abandonedRecovery: "Abandoned-enquiry recovery",
  continuousRetrain: "Continuous AI retraining",
  reviewEngine: "Review & reputation engine",
  noShowReduction: "No-show reduction",
  leadWinBack: "AI lead win-back",
};

/** The lowest plan that unlocks a given feature (for "Upgrade to X" copy). */
export function minPlanFor(flag: PlanFlag): Plan {
  for (const key of PAID_PLANS) {
    if (PLANS[key].flags[flag]) return key;
  }
  return "pro";
}
