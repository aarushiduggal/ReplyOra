"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";

import type { Invoice, LineItem } from "@/lib/social/invoice-types";
import { subtotalCents, totalWithTax } from "@/lib/social/invoice-types";
import {
  createInvoiceAction,
  updateInvoiceStatusAction,
  deleteInvoiceAction,
} from "@/app/(social)/clients/[id]/invoices/actions";
import { GuideTrigger } from "@/components/social/guide";

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ink/10 text-ink/85",
  sent: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
};

export function InvoicesWorkspace({
  clientId,
  clientName,
  invoices,
  defaults,
}: {
  clientId: string;
  clientName: string;
  invoices: Invoice[];
  defaults: { taxRate: number; terms: string; currency: string; billToName: string };
}) {
  const [newOpen, setNewOpen] = useState(false);

  const stats = useMemo(() => {
    const billed = invoices.reduce((s, i) => s + i.totalCents, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalCents, 0);
    const outstanding = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.totalCents, 0);
    const pastDue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.totalCents, 0);
    return { billed, paid, outstanding, pastDue };
  }, [invoices]);

  const cur = defaults.currency;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 09 )</span> Invoices
          <GuideTrigger pageKey="invoices" clientId={clientId} />
        </div>
        <span className="rounded-full border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
          All time ▾
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Billed" value={money(stats.billed, cur)} n={invoices.length} />
        <StatCard label="Paid" value={money(stats.paid, cur)} n={invoices.filter((i) => i.status === "paid").length} tone="text-emerald-700" />
        <StatCard label="Outstanding" value={money(stats.outstanding, cur)} n={invoices.filter((i) => i.status === "sent").length} tone="text-sky-700" />
        <StatCard label="Past due" value={money(stats.pastDue, cur)} n={invoices.filter((i) => i.status === "overdue").length} tone="text-rose-700" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
              {invoices.length} invoices · {clientName}
            </p>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> New invoice
            </button>
          </div>

          {invoices.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-ink/20 px-4 py-12 text-center text-[12px] font-medium text-ink/80">
              No invoices yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/15 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">
                    <th className="py-2 pr-3">Invoice</th>
                    <th className="py-2 pr-3">Issued</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Total</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id} className="border-b border-ink/10">
                      <td className="py-2.5 pr-3 font-semibold text-ink">{i.number}</td>
                      <td className="py-2.5 pr-3 text-ink/85">{i.issuedAt?.slice(0, 10) ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-ink/85">{i.dueAt?.slice(0, 10) ?? "—"}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${STATUS_STYLE[i.status]}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-ink">{money(i.totalCents, i.currency)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <RowActions clientId={clientId} id={i.id} status={i.status} />
                          <a href={`/invoice/${i.id}`} target="_blank" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-oxblood hover:underline">
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

        {/* Right rail */}
        <div className="space-y-4">
          <div className="rounded-xl border border-ink/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Bill to</p>
              <button type="button" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline">Edit</button>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">{defaults.billToName || clientName}</p>
            <p className="text-[12px] text-ink/80">Set the client&apos;s billing details on their first invoice.</p>
          </div>
          <div className="rounded-xl border border-ink/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">In effect</p>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <Row k="Tax rate" v={`${defaults.taxRate}%`} />
              <Row k="Terms" v={defaults.terms || "—"} />
              <Row k="Currency" v={defaults.currency} />
            </dl>
            <p className="mt-2 text-[10px] text-ink/75">Defaults inherited from agency billing (Settings → Workspace).</p>
          </div>
        </div>
      </div>

      {newOpen && (
        <NewInvoiceModal
          clientId={clientId}
          defaults={defaults}
          onClose={() => setNewOpen(false)}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/80">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}

function RowActions({
  clientId,
  id,
  status,
}: {
  clientId: string;
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  function set(next: "sent" | "paid") {
    startTransition(async () => {
      await updateInvoiceStatusAction(clientId, id, next);
      router.refresh();
    });
  }
  function remove() {
    if (!window.confirm("Delete this invoice? This can't be undone.")) return;
    startTransition(async () => {
      await deleteInvoiceAction(clientId, id);
      router.refresh();
    });
  }
  return (
    <>
      {status === "draft" && (
        <button
          type="button"
          onClick={() => set("sent")}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/70 hover:text-oxblood"
        >
          Mark sent
        </button>
      )}
      {(status === "sent" || status === "overdue") && (
        <button
          type="button"
          onClick={() => set("paid")}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 hover:underline"
        >
          Mark paid
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        className="text-ink/40 transition-colors hover:text-rose"
        aria-label="Delete invoice"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </>
  );
}

function StatCard({ label, value, n, tone }: { label: string; value: string; n: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 px-4 py-3">
      <p className={`font-display text-2xl ${tone ?? "text-oxblood"}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">
        {label} · {n}
      </p>
    </div>
  );
}

function NewInvoiceModal({
  clientId,
  defaults,
  onClose,
}: {
  clientId: string;
  defaults: { taxRate: number; terms: string; currency: string; billToName: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitCents: 0 }]);
  const [dueAt, setDueAt] = useState("");
  const [billName, setBillName] = useState(defaults.billToName);
  const [billEmail, setBillEmail] = useState("");
  const [, startTransition] = useTransition();

  function setItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  const total = totalWithTax(items, defaults.taxRate);

  function save() {
    const clean = items.filter((i) => i.description.trim());
    if (clean.length === 0) return;
    startTransition(async () => {
      await createInvoiceAction(clientId, {
        lineItems: clean,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        billTo: { name: billName, email: billEmail, address: "" },
        currency: defaults.currency,
        taxRate: defaults.taxRate,
      });
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-oxblood/15 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-oxblood">New invoice</h3>
          <button onClick={onClose} className="text-ink/80 hover:text-oxblood" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="Bill to (name)" className="rounded-lg border border-oxblood/20 px-3 py-2 text-sm outline-none focus:border-oxblood" />
            <input value={billEmail} onChange={(e) => setBillEmail(e.target.value)} placeholder="Bill to (email)" className="rounded-lg border border-oxblood/20 px-3 py-2 text-sm outline-none focus:border-oxblood" />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">Line items</p>
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} placeholder="Description" className="flex-1 rounded-lg border border-oxblood/20 px-2 py-1.5 text-sm outline-none focus:border-oxblood" />
              <input type="number" min={1} value={it.quantity} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })} className="w-14 rounded-lg border border-oxblood/20 px-2 py-1.5 text-sm outline-none focus:border-oxblood" />
              <input type="number" min={0} step="0.01" value={it.unitCents / 100} onChange={(e) => setItem(idx, { unitCents: Math.round(Number(e.target.value) * 100) })} placeholder="0.00" className="w-24 rounded-lg border border-oxblood/20 px-2 py-1.5 text-sm outline-none focus:border-oxblood" />
              <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="text-ink/60 hover:text-rose" aria-label="Remove line"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems((p) => [...p, { description: "", quantity: 1, unitCents: 0 }])} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline">
            + Add line
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Due date</label>
              <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 w-full rounded-lg border border-oxblood/20 px-3 py-2 text-sm outline-none focus:border-oxblood" />
            </div>
            <div className="flex flex-col justify-end text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink/80">Total (incl {defaults.taxRate}% tax)</p>
              <p className="font-display text-2xl text-oxblood">{money(total, defaults.currency)}</p>
              <p className="text-[10px] text-ink/70">Subtotal {money(subtotalCents(items), defaults.currency)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 hover:text-oxblood">Cancel</button>
            <button type="button" onClick={save} className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90">Create invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}
