# Agency Command Center — install

A complete, drop-in feature: one agency-level view across all clients — **needs content**,
**at-risk**, **team capacity**, and **retainers (recurring billing, Stripe-ready)**.
Built to match your stack (Next App Router, Neon, server actions, oxblood brand) and to run
**with or without a database** — it synthesises a demo agency when `DATABASE_URL` is unset,
exactly like your `portal.ts`.

## 1. Copy the files (paths mirror the repo)

```
migrations/0004_agency_command_center.sql
lib/social/team.ts
lib/social/agency.ts
lib/social/retainers.ts
lib/social/agency-actions.ts
lib/billing/stripe.ts
app/(social)/agency/page.tsx
components/social/agency/command-center.tsx
```

Everything imports via your existing `@/` alias. No existing files are modified except the
one nav line in step 3.

## 2. Run the migration (only if you use Neon)

```bash
psql "$DATABASE_URL" -f migrations/0004_agency_command_center.sql
```

Adds `team_members`, `client_assignments`, `retainers`, and (defensively) `assignee_id` /
`client_id` on `tasks`. Idempotent.

## 3. Add it to the nav

In your top dashboard nav (e.g. `components/social/portal-nav.ts` `WORKSPACE_NAV`, or the
header links in `app/(social)/layout.tsx`) add:

```ts
{ href: "/agency", label: "Command Center" }
```

Put it first — it's the home base.

## 4. (Optional) Turn on real billing

Retainers work immediately in "manual" mode (they stamp `next_invoice_at` and generate the
next invoice when you click **Run due billing**). To auto-charge via Stripe:

```bash
npm i stripe
```

```
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…      # if you add the webhook route below
```

New retainers then become real Stripe subscriptions (`auto_charge = true`). Until the key is
set, `lib/billing/stripe.ts` is a safe no-op and nothing else changes.

Optional webhook to sync paid/failed status (create `app/api/stripe/webhook/route.ts`):

```ts
import { constructWebhookEvent } from "@/lib/billing/stripe";
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const event = await constructWebhookEvent(await req.text(), sig);
  // handle invoice.paid / invoice.payment_failed → update your invoices table
  return new Response("ok");
}
```

## 5. Two seams to wire to your schema (both are forgiving)

- **`agency.ts` invoices query** reads `invoices(client_id, amount_cents, status, due_date)`.
  If your columns differ, adjust that one `SELECT` — it's wrapped in try/catch and falls back
  to `$0`, so it never breaks the page.
- **`retainers.ts → runRetainer()`** inserts into `invoices(...)` best-effort. Point it at your
  existing invoice-creation helper for perfect fidelity (marked with a comment).

## 6. Enforce roles (recommended)

The `/agency` route is already behind your auth-gated `(social)` group. For per-capability
enforcement, resolve the current member's role and gate the actions in
`lib/social/agency-actions.ts` with the `can(role, …)` helper already exported from
`lib/social/team.ts` (guard points are commented in the actions).

## What you get

- **KPI strip** — clients, need-content, at-risk, scheduled next 7d, **MRR**, outstanding (+ past due).
- **Needs content** — every client sorted by *runway* (days of scheduled posts left), with a
  one-click "Draft a month" into Studio.
- **At risk** — health score + specific flags (empty queue, approval overdue, invoice past due,
  gone quiet, unassigned) with inline assign.
- **Team & capacity** — per-member load bars (posts this week vs weekly capacity), role switcher,
  and a client-assignment panel.
- **Retainers** — recurring billing table with MRR, next-invoice dates, pause/resume, invoice-now,
  "run due billing", and a create form (Stripe subscription when live).
