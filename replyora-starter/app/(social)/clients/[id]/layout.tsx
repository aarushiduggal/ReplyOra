import { ClientSubNav } from "@/components/social/client-subnav";
import { PageShell } from "@/components/social/page-shell";
import { clientName } from "@/components/social/portal-nav";
import { SetClientName } from "@/components/social/client-name-context";
import { getClient } from "@/lib/social/clients";
import { currentEntitlements } from "@/lib/social/billing";

/** Per-client shell: breadcrumb + client sub-nav, then the section content. */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Real client name from Neon; fall back to the demo roster, then "Client".
  const [client, { ent }] = await Promise.all([
    getClient(id),
    currentEntitlements(),
  ]);
  const name = client?.name ?? clientName(id);
  // Sections the current plan hasn't unlocked — shown locked in the sub-nav, and
  // the page itself renders an "email us to add it" screen. Chatbox is always
  // shown (per-client/per-site, not a plan gate). Reports = Studio & Agency;
  // client Invoices = Agency only.
  const lockedSlugs = [
    ent.reports ? null : "reports",
    ent.invoicing ? null : "invoices",
  ].filter((s): s is string => s !== null);
  return (
    <>
      <SetClientName name={name} />
      <ClientSubNav clientId={id} clientName={name} lockedSlugs={lockedSlugs} />
      <PageShell>{children}</PageShell>
    </>
  );
}
