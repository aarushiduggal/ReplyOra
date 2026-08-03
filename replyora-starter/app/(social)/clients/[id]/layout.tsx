import { ClientSubNav } from "@/components/social/client-subnav";
import { PageShell } from "@/components/social/page-shell";
import { clientName } from "@/components/social/portal-nav";

/** Per-client shell: breadcrumb + client sub-nav, then the section content. */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <ClientSubNav clientId={id} clientName={clientName(id)} />
      <PageShell>{children}</PageShell>
    </>
  );
}
