import { ClientSubNav } from "@/components/social/client-subnav";
import { PageShell } from "@/components/social/page-shell";
import { clientName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";

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
  const client = await getClient(id);
  const name = client?.name ?? clientName(id);
  return (
    <>
      <ClientSubNav clientId={id} clientName={name} />
      <PageShell>{children}</PageShell>
    </>
  );
}
