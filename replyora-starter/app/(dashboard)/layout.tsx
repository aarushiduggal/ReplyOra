import { redirect } from "next/navigation";
import { USE_AUTHJS } from "@/lib/data/mode";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorkspace } from "@/lib/data/workspace";
import { applyIntendedPlan } from "@/lib/data/apply-plan-intent";
import { listNotifications } from "@/lib/data/notifications";
import { entitlementState, trialDaysLeft } from "@/lib/data/entitlement";
import { PLANS } from "@/lib/stripe/plans";
import { getImpersonation, isPlatformAdmin } from "@/lib/admin/access";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { Toaster } from "@/components/ui/toaster";

/**
 * Dashboard shell. In production this also guards the route (redirect to /login
 * if no session) and resolves the current workspace from membership.
 * // TODO: replace getCurrentUser/getWorkspace with Supabase session lookups.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On the social (Auth.js/Neon) deploy the agency portal at /clients is the
  // product — the legacy chat-widget dashboard is retired here, so send every
  // /dashboard/* hit to /clients. (Vercel/Supabase deploy is unaffected.)
  if (USE_AUTHJS) redirect("/clients");

  // First-load: apply the plan chosen at signup so they trial THAT plan.
  await applyIntendedPlan();

  const [user, workspace, notifications, impersonation, staff] =
    await Promise.all([
      getCurrentUser(),
      getWorkspace(),
      listNotifications(),
      getImpersonation(),
      isPlatformAdmin(),
    ]);
  const plan = PLANS[workspace.plan];

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {impersonation && (
          <ImpersonationBanner
            clientName={workspace.name}
            mode={impersonation.mode}
          />
        )}
        <Topbar
          workspaceName={workspace.name}
          planName={plan.name}
          userName={user.fullName}
          userEmail={user.email}
          notifications={notifications}
          isStaff={staff}
        />
        <TrialBanner
          state={entitlementState(workspace)}
          daysLeft={trialDaysLeft(workspace)}
          planName={plan.name}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
