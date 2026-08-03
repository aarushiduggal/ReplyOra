import Link from "next/link";

import { getInvoices, getRevenue, listClients } from "@/lib/admin/data";

function money(n: number) {
  return `$${n.toLocaleString("en-AU")}`;
}
function date(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const INV_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  upcoming: "bg-sky-100 text-sky-700",
};

export default async function AdminBillingPage() {
  const [revenue, invoices, clients] = await Promise.all([
    getRevenue(),
    Promise.resolve(getInvoices()),
    listClients(),
  ]);
  const nameById = new Map(clients.map((c) => [c.id, c.name]));

  const tiles = [
    { label: "MRR", value: money(revenue.mrr) },
    { label: "ARR", value: money(revenue.arr) },
    { label: "Trial → paid", value: `${revenue.trialToPaid}%` },
    { label: "Failed payments", value: String(revenue.failedPayments) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Billing &amp; revenue</h1>
        <p className="mt-1 text-sm text-ink/60">
          Plan changes, comps and the customer portal live on each client&apos;s
          page. // TODO: wire Stripe for live invoices.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink/50">{t.label}</p>
            <p className="mt-1 font-display text-2xl text-ink">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-3 font-semibold text-ink">By plan</h2>
          <div className="space-y-2 rounded-xl border border-border bg-white p-4">
            {revenue.byPlan.map((p) => (
              <div key={p.plan} className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink/70">{p.plan}</span>
                <span className="text-ink/60">{p.count} · {money(p.mrr)}/mo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-ink">Recent invoices</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border bg-white text-xs uppercase tracking-wide text-ink/60">
                <tr className="[&>th]:px-4 [&>th]:py-2.5">
                  <th>Client</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="[&>td]:px-4 [&>td]:py-2.5">
                    <td>
                      <Link href={`/admin/clients/${inv.clientId}`} className="text-ink hover:underline">
                        {nameById.get(inv.clientId) ?? "Client"}
                      </Link>
                    </td>
                    <td className="text-ink/70">{inv.description}</td>
                    <td className="text-ink/70">{money(inv.amountAud)}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${INV_STYLE[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-ink/50">{date(inv.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
