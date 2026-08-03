import "server-only";

import Stripe from "stripe";

import { PLANS } from "@/lib/stripe/plans";
import type { Plan } from "@/lib/data/types";

/** Stripe is active only when a secret key is present (dormant scaffold otherwise). */
export const HAS_STRIPE = Boolean(process.env.STRIPE_SECRET_KEY);

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

/** Recurring price id for a paid plan (from env, mapped in plans.ts). */
export function priceIdForPlan(plan: Plan): string | null {
  const envName = PLANS[plan].stripePriceIdEnv;
  if (!envName) return null;
  return process.env[envName] ?? null;
}

/** One-time $250 setup-fee price id (added to the first invoice). */
export function setupPriceId(): string | null {
  return process.env.STRIPE_PRICE_SETUP ?? null;
}

/** Reverse-map a Stripe price id back to our plan key (used in the webhook). */
export function planForPriceId(priceId: string): Plan | null {
  for (const key of ["starter", "growth", "pro"] as Plan[]) {
    if (priceIdForPlan(key) === priceId) return key;
  }
  return null;
}
