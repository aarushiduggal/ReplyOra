import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { USE_AUTHJS } from "@/lib/data/mode";
import { isOwner } from "@/lib/auth/owner";
import { readImpersonation } from "@/lib/admin/impersonate";
import { getWorkspaceById } from "@/lib/auth/users";
import { getWorkspaceBilling } from "@/lib/social/billing";
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

  let impersonatingName: string | null = null;
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
      ownerAccountType = billing.accountType;
    }
  }

  // Clients power the global ⌘K command bar (jump straight to any client).
  const clients = (await listClients().catch(() => [])).map((c) => ({
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
