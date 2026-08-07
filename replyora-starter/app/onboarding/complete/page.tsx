import { redirect } from "next/navigation";

import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { setAccountType } from "@/lib/social/billing";
import type { SocialPlan } from "@/lib/social/plans";

export const dynamic = "force-dynamic";

/**
 * Stripe Checkout success lands here after the onboarding trial. We verify the
 * finished session server-side (so access can't be forged by hitting this URL)
 * and only then set the account type + drop the user into the dashboard. The
 * webhook independently syncs plan + status + subscription id.
 */
export default async function OnboardingCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!HAS_STRIPE || !session_id) redirect("/onboarding");

  let plan: SocialPlan | null = null;
  try {
    const workspaceId = await getCurrentWorkspaceId();
    const session = await getStripe().checkout.sessions.retrieve(session_id);
    const meta = session.metadata ?? {};
    // Must be a completed session that belongs to THIS workspace.
    if (session.status === "complete" && meta.workspace_id === workspaceId) {
      const p = meta.social_plan;
      if (p === "personal" || p === "studio" || p === "agency") plan = p;
    }
  } catch {
    /* fall through → back to onboarding */
  }

  if (!plan) redirect("/onboarding");
  await setAccountType(plan);
  redirect("/clients");
}
