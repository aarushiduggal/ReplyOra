import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { AccountTypeChooser } from "@/components/social/account-type-chooser";
import { getCurrentUser } from "@/lib/auth/session";
import { USE_AUTHJS } from "@/lib/data/mode";
import { isOwner } from "@/lib/auth/owner";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { HAS_STRIPE } from "@/lib/stripe/server";
import { ACCOUNT_INTENT_COOKIE, normalizeAccountSlug } from "@/lib/plan-intent";

export const dynamic = "force-dynamic";

/**
 * Onboarding.
 * Social (Auth.js): new users pick Personal or Agency before the dashboard.
 * Legacy (Supabase): the original business-profile wizard.
 */
export default async function OnboardingPage() {
  if (!USE_AUTHJS) {
    return (
      <div className="min-h-screen bg-cream">
        <OnboardingWizard />
      </div>
    );
  }

  const user = await getCurrentUser(); // redirects to /login if signed out
  if (isOwner(user.email)) redirect("/clients"); // owners skip onboarding
  const billing = await getWorkspaceBilling();
  if (billing.accountType) redirect("/clients"); // already chosen

  const first = user.fullName?.split(/\s+/)[0] ?? "";
  const preselect =
    normalizeAccountSlug((await cookies()).get(ACCOUNT_INTENT_COOKIE)?.value) ??
    undefined;
  return (
    <div className="min-h-screen bg-white text-ink">
      <AccountTypeChooser name={first} preselect={preselect} stripeReady={HAS_STRIPE} />
    </div>
  );
}
