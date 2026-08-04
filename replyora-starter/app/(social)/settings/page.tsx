import { PageShell } from "@/components/social/page-shell";
import { SettingsWorkspace } from "@/components/social/settings/settings-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { HAS_STRIPE } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, billing] = await Promise.all([
    getCurrentUser(),
    getWorkspaceBilling(),
  ]);

  return (
    <PageShell>
      <SettingsWorkspace
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
