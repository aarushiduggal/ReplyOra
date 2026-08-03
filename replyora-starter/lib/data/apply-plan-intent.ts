import "server-only";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";
import { normalizePlanSlug, PLAN_INTENT_COOKIE } from "@/lib/plan-intent";

/**
 * On a new tenant's first dashboard load, apply the plan they chose at signup so
 * they trial THAT plan for their 7 days (features + what they'll be billed for
 * when the trial ends).
 *
 * Acts at most once per workspace: only while still generic (`plan='none'`) and
 * `trialing`. Never touches a paid/converted workspace, and never overrides a
 * plan already chosen — so it's safe to call on every dashboard load.
 */
export async function applyIntendedPlan(): Promise<void> {
  if (!USE_SUPABASE) return;
  try {
    const workspaceId = await getCurrentWorkspaceId();
    const supabase = await createClient();
    const { data: ws } = await supabase
      .from("workspaces")
      .select("plan, plan_status")
      .eq("id", workspaceId)
      .maybeSingle();

    // Only apply to a brand-new, still-generic trial.
    if (!ws || ws.plan !== "none" || ws.plan_status !== "trialing") return;

    // Chosen plan: signup metadata first, then the OAuth cookie fallback.
    const { data: userData } = await supabase.auth.getUser();
    const metaPlan = userData.user?.user_metadata?.intended_plan as
      | string
      | undefined;
    const cookiePlan = (await cookies()).get(PLAN_INTENT_COOKIE)?.value;
    const plan = normalizePlanSlug(metaPlan) ?? normalizePlanSlug(cookiePlan);
    if (!plan) return;

    // Keep them trialing — the trial window (trial_ends_at) is untouched; we're
    // only setting WHICH plan the 7-day trial is for.
    await createAdminClient()
      .from("workspaces")
      .update({ plan })
      .eq("id", workspaceId);
  } catch {
    // Non-fatal — fall back to the generic trial.
  }
}
