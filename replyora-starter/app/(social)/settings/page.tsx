import { PageShell } from "@/components/social/page-shell";
import { SettingsWorkspace } from "@/components/social/settings/settings-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { HAS_STRIPE } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ tab }, user, billing] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getWorkspaceBilling(),
  ]);
  // Upsell CTAs link here with ?tab=plan|billing → open the Billing tab.
  const initialTab =
    tab === "plan" || tab === "billing" ? "Billing" : undefined;

  return (
    <PageShell>
      <SettingsWorkspace
        initialTab={initialTab}
        fullName={user.fullName}
        email={user.email}
        billing={billing}
        currentPlan={billing.plan}
        planStatus={
          billing.planStatus === "active"
            ? "Active"
            : billing.planStatus === "trialing"
              ? "Trial · 7 days"
              : billing.planStatus === "past_due"
                ? "Payment overdue"
                : billing.planStatus === "canceled"
                  ? "Cancelled"
                  : billing.planStatus
        }
        stripeReady={HAS_STRIPE}
      />
    </PageShell>
  );
}
