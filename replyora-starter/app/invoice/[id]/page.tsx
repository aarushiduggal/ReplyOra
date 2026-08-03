import { notFound } from "next/navigation";

import { PrintButton } from "@/components/social/invoices/print-button";
import { getClient } from "@/lib/social/clients";
import { getInvoice, subtotalCents } from "@/lib/social/invoices";
import { getWorkspaceBilling } from "@/lib/social/billing";

export const dynamic = "force-dynamic";

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [billing, client] = await Promise.all([
    getWorkspaceBilling(),
    getClient(invoice.clientId),
  ]);

  const sub = subtotalCents(invoice.lineItems);
  const taxCents = invoice.totalCents - sub;

  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-2xl px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            {billing.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={billing.logoUrl} alt="" className="mb-2 h-10" />
            ) : (
              <p className="font-wordmark text-2xl lowercase text-oxblood">replyora°</p>
            )}
            <p className="mt-1 text-sm font-semibold text-ink">{billing.businessName || "Your Studio"}</p>
            {billing.address.street && (
              <p className="text-[12px] text-ink/70">
                {billing.address.street}, {billing.address.city} {billing.address.state} {billing.address.zip}
              </p>
            )}
            {billing.businessEmail && <p className="text-[12px] text-ink/70">{billing.businessEmail}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-oxblood">Invoice</p>
            <p className="mt-1 text-sm font-semibold text-ink">{invoice.number}</p>
            <p className="text-[12px] text-ink/70">Issued {invoice.issuedAt?.slice(0, 10) ?? "—"}</p>
            <p className="text-[12px] text-ink/70">Due {invoice.dueAt?.slice(0, 10) ?? "—"}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/60">Bill to</p>
          <p className="mt-1 text-sm font-semibold text-ink">{invoice.billTo?.name || client?.name || "Client"}</p>
          {invoice.billTo?.email && <p className="text-[12px] text-ink/70">{invoice.billTo.email}</p>}
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/20 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((it, i) => (
              <tr key={i} className="border-b border-ink/10">
                <td className="py-2.5 text-ink">{it.description}</td>
                <td className="py-2.5 text-center text-ink/70">{it.quantity}</td>
                <td className="py-2.5 text-right text-ink/70">{money(it.unitCents, invoice.currency)}</td>
                <td className="py-2.5 text-right font-semibold text-ink">{money(it.quantity * it.unitCents, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between text-ink/70"><span>Subtotal</span><span>{money(sub, invoice.currency)}</span></div>
          <div className="flex justify-between text-ink/70"><span>Tax ({invoice.taxRate}%)</span><span>{money(taxCents, invoice.currency)}</span></div>
          <div className="flex justify-between border-t border-ink/20 pt-1 text-base font-semibold text-oxblood">
            <span>Total</span><span>{money(invoice.totalCents, invoice.currency)}</span>
          </div>
        </div>

        {billing.terms && (
          <p className="mt-8 text-[11px] text-ink/60">{billing.terms}</p>
        )}

        <div className="mt-8 print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
