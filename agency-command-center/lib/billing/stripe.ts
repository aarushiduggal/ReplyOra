/**
 * ReplyOra — Stripe wrapper (dormant-safe).
 *
 * Everything here is a NO-OP until STRIPE_SECRET_KEY is set, so the app builds
 * and runs with zero billing config. When you're ready:
 *   1. `npm i stripe`
 *   2. add STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) to the env
 * The client is loaded lazily via dynamic import, so the `stripe` package is
 * only required once you actually switch it on.
 */

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Typed loosely on purpose so the file compiles before `stripe` is installed.
type StripeClient = {
  customers: { create: (a: Record<string, unknown>) => Promise<{ id: string }> };
  prices: { create: (a: Record<string, unknown>) => Promise<{ id: string }> };
  subscriptions: {
    create: (a: Record<string, unknown>) => Promise<{ id: string; status: string }>;
    update: (id: string, a: Record<string, unknown>) => Promise<{ id: string }>;
  };
  invoiceItems: { create: (a: Record<string, unknown>) => Promise<{ id: string }> };
  invoices: {
    create: (a: Record<string, unknown>) => Promise<{ id: string; hosted_invoice_url?: string }>;
    finalizeInvoice: (id: string) => Promise<{ id: string; hosted_invoice_url?: string }>;
  };
  webhooks: { constructEvent: (body: string, sig: string, secret: string) => unknown };
};

let _client: StripeClient | null = null;

async function client(): Promise<StripeClient> {
  if (!stripeEnabled()) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  if (_client) return _client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("stripe").catch(() => {
    throw new Error("The 'stripe' package is not installed. Run `npm i stripe`.");
  });
  const Stripe = mod.default ?? mod;
  _client = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" }) as StripeClient;
  return _client;
}

const intervalToStripe: Record<string, { interval: string; interval_count: number }> = {
  week: { interval: "week", interval_count: 1 },
  month: { interval: "month", interval_count: 1 },
  quarter: { interval: "month", interval_count: 3 },
};

/** Create (or reuse) a Stripe customer for a client. Returns customer id. */
export async function ensureCustomer(name: string, email?: string): Promise<string> {
  const c = await client();
  const cust = await c.customers.create({ name, email, metadata: { source: "replyora" } });
  return cust.id;
}

/** Stand up a recurring subscription for a retainer. Returns subscription id. */
export async function createRetainerSubscription(opts: {
  customerId: string;
  amountCents: number;
  currency: string;
  interval: "week" | "month" | "quarter";
  productName: string;
}): Promise<{ subscriptionId: string; status: string }> {
  const c = await client();
  const price = await c.prices.create({
    unit_amount: opts.amountCents,
    currency: opts.currency.toLowerCase(),
    recurring: intervalToStripe[opts.interval] ?? intervalToStripe.month,
    product_data: { name: opts.productName },
  });
  const sub = await c.subscriptions.create({
    customer: opts.customerId,
    items: [{ price: price.id }],
    collection_method: "charge_automatically",
    metadata: { source: "replyora" },
  });
  return { subscriptionId: sub.id, status: sub.status };
}

export async function pauseSubscription(subscriptionId: string): Promise<void> {
  const c = await client();
  await c.subscriptions.update(subscriptionId, { pause_collection: { behavior: "void" } });
}

/** One-off invoice (used when auto_charge is off — sends a payable link). */
export async function createOneOffInvoice(opts: {
  customerId: string;
  amountCents: number;
  currency: string;
  description: string;
  daysUntilDue?: number;
}): Promise<{ invoiceId: string; url: string | null }> {
  const c = await client();
  await c.invoiceItems.create({
    customer: opts.customerId,
    amount: opts.amountCents,
    currency: opts.currency.toLowerCase(),
    description: opts.description,
  });
  const inv = await c.invoices.create({
    customer: opts.customerId,
    collection_method: "send_invoice",
    days_until_due: opts.daysUntilDue ?? 14,
  });
  const finalised = await c.invoices.finalizeInvoice(inv.id);
  return { invoiceId: finalised.id, url: finalised.hosted_invoice_url ?? null };
}

/** Verify + parse a Stripe webhook (for payment-status sync). */
export async function constructWebhookEvent(rawBody: string, signature: string): Promise<unknown> {
  const c = await client();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  return c.webhooks.constructEvent(rawBody, signature, secret);
}
