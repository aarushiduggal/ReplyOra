import Link from "next/link";

import { PageShell } from "@/components/social/page-shell";
import { SectionHeader } from "@/components/social/section-header";
import { LockedSection } from "@/components/social/locked-section";
import { listAllInvoices } from "@/lib/social/invoices";
import { listClients } from "@/lib/social/clients";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { entitlementsFor } from "@/lib/social/plans";

export const dynamic = "force-dynamic";

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(
    cents / 100,
  );
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ink/10 text-ink/70",
  sent: "bg-rose/15 text-oxblood",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-amber-100 text-amber-800",
};

export default async function InvoicesPage() {
  const billing = await getWorkspaceBilling();
  if (!entitlementsFor(billing.accountType, billing.addons).invoicing) {
    return (
      <PageShell>
        <LockedSection
          title="Client invoicing is on Agency"
          description="Bill your clients with branded, tax-ready invoices and PDF exports across your whole roster. It's included on the Agency plan — email us and we'll add it."
          addonLabel="Client invoicing"
          priceLabel="Agency plan"
        />
      </PageShell>
    );
  }

  const [invoices, clients] = await Promise.all([
    listAllInvoices().catch(() => []),
    listClients().catch(() => []),
  ]);
  const nameFor = new Map(clients.map((c) => [c.id, c.name]));

  const currency = invoices[0]?.currency ?? "AUD";
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.totalCents, 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.totalCents, 0);

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <SectionHeader num="04" label="Invoices" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          {invoices.length} total
        </span>
      </div>

      <p className="mt-3 max-w-lg text-sm font-medium text-ink/85">
        Every invoice across all your clients, in one place. Create and edit them
        on each client&rsquo;s Invoices tab.
      </p>

      {/* Revenue summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-oxblood/10 bg-white px-5 py-4">
          <p className="font-display text-3xl text-emerald-700">{money(paid, currency)}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
            Paid · all time
          </p>
        </div>
        <div className="rounded-2xl border border-oxblood/10 bg-white px-5 py-4">
          <p className="font-display text-3xl text-oxblood">{money(outstanding, currency)}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
            Outstanding
          </p>
        </div>
      </div>

      {/* All invoices */}
      <div className="mt-10">
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/25 px-8 py-14 text-center">
            <p className="font-display text-2xl text-oxblood">No invoices yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-ink/85">
              Open a client &rarr; <strong>Invoices</strong> to create your first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ink/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink/15 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {invoices.map((i) => (
                  <tr key={i.id} className="[&>td]:px-4 [&>td]:py-3">
                    <td className="font-semibold text-ink">{i.number}</td>
                    <td className="text-ink/80">{nameFor.get(i.clientId) ?? "—"}</td>
                    <td className="text-ink/70">{i.issuedAt?.slice(0, 10) ?? "—"}</td>
                    <td>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${STATUS_STYLE[i.status] ?? "bg-ink/10 text-ink/70"}`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-ink">
                      {money(i.totalCents, i.currency)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/clients/${i.clientId}/invoices`}
                          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/60 hover:text-oxblood"
                        >
                          Open
                        </Link>
                        <a
                          href={`/invoice/${i.id}`}
                          target="_blank"
                          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-oxblood hover:underline"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
