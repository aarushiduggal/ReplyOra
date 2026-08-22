import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { USE_AUTHJS } from "@/lib/data/mode";
import { isOwner } from "@/lib/auth/owner";
import { readImpersonation } from "@/lib/admin/impersonate";
import { getWorkspaceById } from "@/lib/auth/users";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { betaWindowFor, type BetaWindow } from "@/lib/beta";
import { listClients } from "@/lib/social/clients";
import type { SocialPlan } from "@/lib/social/plans";

import { PortalTopNav } from "@/components/social/portal-topnav";
import { CommandBar } from "@/components/social/command-bar";
import { PortalFooter } from "@/components/social/portal-footer";
import { TodoPill } from "@/components/social/todo-pill";
import { ClientNameProvider } from "@/components/social/client-name-context";
import { GuideProvider } from "@/components/social/guide";
import { OwnerPanel } from "@/components/social/owner-panel";
import { ImpersonationBanner } from "@/components/social/impersonation-banner";
import { BetaBanner } from "@/components/social/beta-banner";
import { Toaster } from "@/components/ui/toaster";

/**
 * replyora Social portal shell. Gated by getCurrentUser() (→ /login when signed
 * out). Also: forces new users through /onboarding to pick Personal/Agency,
 * shows the staff impersonation banner, and the owner demo panel.
 */
export default async function SocialPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Clients power the global ⌘K command bar — they don't gate anything, so kick
  // the query off now and let it run CONCURRENTLY with the billing/impersonation
  // work below instead of stacking after it (shaves a DB round-trip off every
  // dashboard navigation).
  const clientsPromise = listClients().catch(() => []);

  let impersonatingName: string | null = null;
  let beta: BetaWindow | null = null;
  let owner = false;
  let ownerAccountType: SocialPlan | null = null;

  if (USE_AUTHJS) {
    owner = isOwner(user.email);
    const imp = await readImpersonation();
    const impersonating = Boolean(imp && imp.actorUserId === user.id);
    if (impersonating && imp) {
      const ws = await getWorkspaceById(imp.workspaceId);
      impersonatingName = ws?.name ?? "workspace";
    }

    if (!impersonating) {
      const billing = await getWorkspaceBilling(); // the user's OWN workspace
      // New users must pick an account type before the dashboard (owners skip).
      if (!owner && !billing.accountType) redirect("/onboarding");
      // A canceled subscription (trial expired without payment, or cancelled)
      // loses access — send them to re-subscribe. trialing/active/past_due keep
      // access (Stripe handles dunning during past_due).
      if (!owner && billing.planStatus === "canceled") {
        redirect("/onboarding?reactivate=1");
      }

      // Closed beta: 30 days of full access, then the door closes unless they
      // subscribe. Checked AFTER the canceled check so a beta tester who paid
      // and later cancelled follows the normal reactivate path.
      if (!owner) {
        beta = await betaWindowFor(user.email);
        if (beta.isBeta && !beta.active && !billing.hasStripeSubscription) {
          redirect("/beta-ended");
        }
      }
      ownerAccountType = billing.accountType;
    }
  }

  const clients = (await clientsPromise).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <ClientNameProvider>
      <GuideProvider>
        <div className="flex min-h-screen flex-col bg-cream text-ink">
          {impersonatingName && (
            <ImpersonationBanner workspaceName={impersonatingName} />
          )}
          {beta?.active && (
            <BetaBanner daysLeft={beta.daysLeft} expiresAt={beta.expiresAt} />
          )}
          <PortalTopNav />
          <main className="flex-1">{children}</main>
          <PortalFooter />
          <TodoPill />
          <CommandBar clients={clients} />
          {owner && !impersonatingName && (
            <OwnerPanel accountType={ownerAccountType} />
          )}
          {/* Renders success/error toasts (publish results, connect, etc.).
              Was missing here, so all dashboard feedback fired invisibly. */}
          <Toaster />
        </div>
      </GuideProvider>
    </ClientNameProvider>
  );
}
