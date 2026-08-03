import { InvoicesWorkspace } from "@/components/social/invoices/invoices-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientInvoices } from "@/lib/social/invoices";
import { getWorkspaceBilling } from "@/lib/social/billing";

export const dynamic = "force-dynamic";

export default async function ClientInvoicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, invoices, billing] = await Promise.all([
    getClient(id),
    listClientInvoices(id),
    getWorkspaceBilling(),
  ]);
  const name = client?.name ?? sampleName(id);

  return (
    <InvoicesWorkspace
      clientId={id}
      clientName={name}
      invoices={invoices}
      defaults={{
        taxRate: billing.taxRate,
        terms: billing.terms,
        currency: billing.currency,
        billToName: name,
      }}
    />
  );
}
