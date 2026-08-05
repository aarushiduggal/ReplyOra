import { neon } from "@neondatabase/serverless";

import {
  stripeEnabled,
  ensureCustomer,
  createRetainerSubscription,
  pauseSubscription,
  createOneOffInvoice,
} from "@/lib/billing/stripe";

/**
 * ReplyOra — Retainers (recurring billing).
 *
 * A retainer is a client's recurring fee. If Stripe is configured it becomes a
 * real Stripe subscription (auto-charge). If not, it runs "manually": every
 * cycle it stamps `next_invoice_at`, and `runDueRetainers()` (call from a cron
 * or the Command Center "Run billing" button) generates the next invoice.
 */

export type RetainerInterval = "week" | "month" | "quarter";
export type RetainerStatus = "active" | "paused" | "cancelled";

export interface Retainer {
  id: string;
  clientId: string;
  name: string;
  amountCents: number;
  currency: string;
  interval: RetainerInterval;
  status: RetainerStatus;
  anchorDay: number;
  nextInvoiceAt: string | null;
  lastInvoicedAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  autoCharge: boolean;
  createdAt: string;
}

/** Normalise any interval to a monthly figure — used for MRR. */
export function monthlyValueCents(r: Pick<Retainer, "amountCents" | "interval">): number {
  switch (r.interval) {
    case "week": return Math.round(r.amountCents * 52 / 12);
    case "quarter": return Math.round(r.amountCents / 3);
    default: return r.amountCents;
  }
}

/* ─────────────────────────────  storage  ──────────────────────────── */

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

function advance(fromISO: string | null, interval: RetainerInterval, anchorDay: number): string {
  const base = fromISO ? new Date(fromISO) : new Date();
  const d = new Date(base);
  if (interval === "week") d.setDate(d.getDate() + 7);
  else if (interval === "quarter") d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  if (interval !== "week") d.setDate(Math.min(anchorDay, 28));
  return d.toISOString();
}

const DEMO_RETAINERS: Retainer[] = [
  demo("rt_bloom", "cl_demo_bloom", "Bloom — social retainer", 120000, "month", 5),
  demo("rt_coastal", "cl_demo_coastal", "Coastal Glow — content + ads", 90000, "month", 1),
  demo("rt_marlowe", "cl_demo_marlowe", "Marlowe & Co — starter", 60000, "month", 15),
  demo("rt_fern", "cl_demo_fern", "Fern & Fig — full service", 150000, "month", 1),
];

function demo(id: string, clientId: string, name: string, amount: number, interval: RetainerInterval, anchor: number): Retainer {
  const next = advance(new Date().toISOString(), interval, anchor);
  return {
    id, clientId, name, amountCents: amount, currency: "AUD", interval,
    status: "active", anchorDay: anchor, nextInvoiceAt: next, lastInvoicedAt: null,
    stripeCustomerId: null, stripeSubscriptionId: null, autoCharge: false,
    createdAt: new Date(Date.now() - 60 * 864e5).toISOString(),
  };
}

/* ─────────────────────────────  queries  ──────────────────────────── */

export async function listRetainers(): Promise<Retainer[]> {
  if (!hasDb()) return DEMO_RETAINERS;
  const rows = (await sql()`
    SELECT * FROM retainers ORDER BY status = 'active' DESC, next_invoice_at ASC NULLS LAST
  `) as Record<string, unknown>[];
  return rows.map(map);
}

export async function createRetainer(input: {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  name: string;
  amountCents: number;
  currency?: string;
  interval?: RetainerInterval;
  anchorDay?: number;
}): Promise<Retainer> {
  const id = "rt_" + Math.random().toString(36).slice(2, 10);
  const interval = input.interval ?? "month";
  const anchorDay = input.anchorDay ?? 1;
  const currency = input.currency ?? "AUD";

  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let autoCharge = false;

  if (stripeEnabled()) {
    stripeCustomerId = await ensureCustomer(input.clientName, input.clientEmail);
    const sub = await createRetainerSubscription({
      customerId: stripeCustomerId,
      amountCents: input.amountCents,
      currency,
      interval,
      productName: input.name,
    });
    stripeSubscriptionId = sub.subscriptionId;
    autoCharge = true;
  }

  const retainer: Retainer = {
    id, clientId: input.clientId, name: input.name, amountCents: input.amountCents,
    currency, interval, status: "active", anchorDay,
    nextInvoiceAt: advance(new Date().toISOString(), interval, anchorDay),
    lastInvoicedAt: null, stripeCustomerId, stripeSubscriptionId, autoCharge,
    createdAt: new Date().toISOString(),
  };

  if (hasDb()) {
    await sql()`
      INSERT INTO retainers
        (id, client_id, name, amount_cents, currency, interval, status, anchor_day,
         next_invoice_at, stripe_customer_id, stripe_subscription_id, auto_charge)
      VALUES
        (${id}, ${retainer.clientId}, ${retainer.name}, ${retainer.amountCents}, ${currency},
         ${interval}, 'active', ${anchorDay}, ${retainer.nextInvoiceAt},
         ${stripeCustomerId}, ${stripeSubscriptionId}, ${autoCharge})
    `;
  }
  return retainer;
}

export async function setRetainerStatus(id: string, status: RetainerStatus): Promise<void> {
  if (hasDb()) await sql()`UPDATE retainers SET status = ${status} WHERE id = ${id}`;
  const r = (await listRetainers()).find((x) => x.id === id);
  if (status !== "active" && r?.stripeSubscriptionId && stripeEnabled()) {
    await pauseSubscription(r.stripeSubscriptionId).catch(() => {});
  }
}

/** Retainers whose next invoice is due now (manual/non-Stripe billing). */
export async function dueRetainers(): Promise<Retainer[]> {
  const all = await listRetainers();
  const t = Date.now();
  return all.filter((r) => r.status === "active" && !r.autoCharge && r.nextInvoiceAt && new Date(r.nextInvoiceAt).getTime() <= t);
}

/**
 * Generate the next invoice for a retainer and roll `next_invoice_at` forward.
 * If Stripe is on, this sends a hosted invoice; otherwise it writes a row into
 * your existing `invoices` table (best-effort) so it shows on the client's
 * Invoices tab. Returns a payable URL when one exists.
 */
export async function runRetainer(id: string, clientName?: string, clientEmail?: string): Promise<{ url: string | null }> {
  const r = (await listRetainers()).find((x) => x.id === id);
  if (!r || r.status !== "active") return { url: null };

  let url: string | null = null;
  if (stripeEnabled()) {
    const customerId = r.stripeCustomerId ?? (await ensureCustomer(clientName ?? "Client", clientEmail));
    const res = await createOneOffInvoice({
      customerId,
      amountCents: r.amountCents,
      currency: r.currency,
      description: r.name,
      daysUntilDue: 14,
    });
    url = res.url;
  } else if (hasDb()) {
    // Best-effort insert into an existing invoices table. Adjust column names in
    // your schema if they differ — this is intentionally forgiving.
    try {
      const invId = "inv_" + Math.random().toString(36).slice(2, 10);
      const due = new Date(Date.now() + 14 * 864e5).toISOString();
      await sql()`
        INSERT INTO invoices (id, client_id, amount_cents, currency, status, due_date, created_at)
        VALUES (${invId}, ${r.clientId}, ${r.amountCents}, ${r.currency}, 'sent', ${due}, NOW())
      `;
    } catch {
      /* schema differs — wire runRetainer() to your invoices lib instead */
    }
  }

  if (hasDb()) {
    await sql()`
      UPDATE retainers
      SET last_invoiced_at = NOW(),
          next_invoice_at = ${advance(r.nextInvoiceAt, r.interval, r.anchorDay)}
      WHERE id = ${id}
    `;
  }
  return { url };
}

export async function runDueRetainers(): Promise<number> {
  const due = await dueRetainers();
  for (const r of due) await runRetainer(r.id);
  return due.length;
}

function map(r: Record<string, unknown>): Retainer {
  return {
    id: String(r.id),
    clientId: String(r.client_id),
    name: String(r.name),
    amountCents: Number(r.amount_cents),
    currency: String(r.currency ?? "AUD"),
    interval: (r.interval as RetainerInterval) ?? "month",
    status: (r.status as RetainerStatus) ?? "active",
    anchorDay: Number(r.anchor_day ?? 1),
    nextInvoiceAt: r.next_invoice_at ? new Date(String(r.next_invoice_at)).toISOString() : null,
    lastInvoicedAt: r.last_invoiced_at ? new Date(String(r.last_invoiced_at)).toISOString() : null,
    stripeCustomerId: (r.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (r.stripe_subscription_id as string) ?? null,
    autoCharge: Boolean(r.auto_charge),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}
