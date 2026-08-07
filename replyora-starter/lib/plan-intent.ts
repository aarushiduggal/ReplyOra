import type { Plan } from "@/lib/data/types";

/**
 * The plan a visitor chose at signup ("trial THIS plan for 7 days"). Carried
 * through email/password signup via user metadata, and through Google OAuth via
 * this short-lived cookie (metadata isn't available on the OAuth round-trip).
 */
export const PLAN_INTENT_COOKIE = "rly_plan";

/**
 * The social account type a visitor picked on /pricing ("Start trial" →
 * /signup?plan=studio). Carried across signup so /onboarding can pre-select it.
 */
export const ACCOUNT_INTENT_COOKIE = "rly_acct";

/** Normalize an arbitrary string to a social plan slug, else null. */
export function normalizeAccountSlug(
  v: string | null | undefined,
): "personal" | "studio" | "agency" | null {
  const s = (v ?? "").trim().toLowerCase();
  return s === "personal" || s === "studio" || s === "agency" ? s : null;
}

/** Plans a new tenant can start a trial on. */
export const TRIALABLE_PLANS: Plan[] = ["starter", "growth", "pro"];

/** Validate/normalize an arbitrary string to a trialable plan slug, else null. */
export function normalizePlanSlug(v: string | null | undefined): Plan | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  return (TRIALABLE_PLANS as string[]).includes(s) ? (s as Plan) : null;
}
