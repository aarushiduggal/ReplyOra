import { InvoicesWorkspace } from "@/components/social/invoices/invoices-workspace";
import { LockedSection } from "@/components/social/locked-section";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientInvoices } from "@/lib/social/invoices";
import { getWorkspaceBilling, currentEntitlements } from "@/lib/social/billing";

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

  // Client invoicing + branded PDF exports are on the Agency plan.
  const { ent } = await currentEntitlements();
  if (!ent.invoicing) {
    return (
      <LockedSection
        title="Client invoicing is on Studio & Agency"
        description="Bill your clients with branded, tax-ready invoices and PDF exports. It's included on Studio & Agency — email us and we'll add it."
        addonLabel="Client invoicing"
        priceLabel="Studio plan · from $79/mo AUD"
      />
    );
  }

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
