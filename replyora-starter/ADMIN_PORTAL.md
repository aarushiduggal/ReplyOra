# Replyora — Staff Portal (super-admin command center)

Internal back-office at **`/admin`** where Replyora staff manage every client, run the done-for-you service, and see the business. Separate from the client dashboard. Built on `0002_platform_admin.sql`.

## Security (non-negotiable)
- Only users in `platform_admins` can reach `/admin`. Enforce in middleware **and** in every `/api/admin/*` handler via `is_platform_admin(auth.uid())`. Everyone else → 404/redirect.
- Cross-client data goes through **server-side handlers using the service role**; never the browser. Per-tenant RLS from 0001 stays untouched.
- **Every staff view/edit is written to `audit_logs`** (who, which workspace, what action).
- Clearly badge it as an internal **Staff / Admin** area (distinct header) so it's never confused with a client dashboard.

## 1. Command center (home)
Platform KPIs at a glance + an "attention" queue.
- KPIs: total clients, active / trialing / past-due / paused, **MRR & ARR**, new signups this week, trials ending in 3 days, churn this month, and platform totals (messages, leads, bookings) + estimated AI cost.
- **Attention queue** (the most useful thing): trials ending soon, failed payments, clients over their message/page limits, new signups awaiting setup, update requests pending, performance calls due, assistants with a spike of "couldn't answer" questions.
- Revenue trend chart.

## 2. Clients (businesses)
- List every workspace: name, owner + email, plan, status, MRR, signup date, last active, usage (messages used / cap), setup status. Searchable/filterable/sortable.
- **Drill into any client** → full access to everything in their workspace: Business profile, Knowledge base, Assistant config, Conversations, Leads, Bookings, Analytics, Install, Settings — **view and edit on their behalf** (done-for-you).
- **"View as" (impersonate, read-only)** — see exactly what the client sees, for support.
- Client actions: change plan, pause/suspend, cancel, comp a month / apply discount, resend setup, delete (with confirm + audit).
- Internal notes per client (private staff notes).

## 3. Service delivery (runs your done-for-you model)
This is what makes it a service business, not just software.
- **Onboarding pipeline** — new signups needing the $250 setup; a per-client checklist (build assistant → train on their info → add booking → install snippet → go live), with status.
- **Update / retrain queue** — a simple ticket list of change requests: Starter extra updates ($25 each), Growth 90-day proactive refreshes due, Pro anytime requests. Mark in-progress / done, log the work.
- **Performance-call scheduler** — who's due (Growth every 90 days, Pro every 60), book + log the call, notes.
- **Service history / log** per client.

## 4. Billing & revenue
- Per client: plan, Stripe status, setup-fee-paid, invoices, extra-update charges, MRR, next renewal.
- Charge extra updates ($25), apply discounts/comps, trigger the customer portal.
- Revenue view: MRR/ARR, by plan, trial→paid conversion, churn, failed-payment / dunning list.

## 5. Assistant quality & retraining
- Across clients: assistants flagged with many "couldn't answer" questions, failed knowledge sources, low usage.
- **Knowledge-gap suggestions** — surface questions the AI couldn't answer so you (or the continuous-retrain feature) can add them. Feeds the Pro "continuous retraining" promise.

## 6. Staff & access (superadmin)
- Manage `platform_admins` (add/remove staff, roles: staff / superadmin).
- **Audit log viewer** — every staff action, filterable by staff member / client / date.

## 7. Broadcast / comms (nice-to-have)
- Send an announcement or email to all clients (e.g. new feature, maintenance).
- See client support messages in one place.

## Build order
1. `/admin` shell + access control (middleware + `is_platform_admin`) + audit logging.
2. Clients list + client detail (view/edit their whole workspace) + "view as".
3. Command-center home (KPIs + attention queue).
4. Service delivery (onboarding pipeline, update/retrain queue, performance-call scheduler).
5. Billing & revenue.
6. Assistant quality / knowledge-gaps.
7. Staff management + audit viewer.
8. Broadcast/comms.

**Test:** log in as a normal client → confirm `/admin` is blocked; add yourself to `platform_admins` → confirm access; edit a client's knowledge base from `/admin` → confirm it changed on their side and an audit row was written.

---

## v2 enhancements (from the live review)

**Bug:** `/admin/service` text renders near-invisible (low contrast) — fix to readable oxblood/ink on light bg. Isolated to that page.

**Command center:** trend arrows (MRR/churn vs last period); a **gross-margin** figure (MRR vs AI cost); sort attention queue by urgency (failed payment / overdue call / over-limit above update requests) with each item **clickable → its client/action** + snooze; over-limit item offers "upgrade/add credits".

**Clients:** working search + filters (plan/status/over-limit/setup) + column sort; each row → client detail; risk flags (over-limit red, past-due, trial countdown); per-client **health dot** (usage + payment + unanswered questions); "Add client" manually + CSV export.

**Service delivery:** plan-specific onboarding checklist (Pro adds calendar/review-engine/no-show setup; Growth adds booking; Starter FAQs); working **"Charge $25"** on Starter extras (creates billable line); **auto-generate** Growth-90-day/Pro refresh tasks when due; "Mark done" → per-client **service history** + audit; **"commitments at risk"** strip; "Open workspace"/"Open KB" jump links; call-outcome logging that auto-sets next due date + a mini client snapshot on each call.

**Billing:** actions on failed payments (retry/chase/dunning); show **$25 extra-update charges** as billable line items (tie to service queue); **MRR movement** (new/expansion/contraction/churn) + upcoming renewals; setup-fee tracker.

**Assistant quality:** "Add to KB" opens an editor with an **AI-drafted answer** to approve → pushes to client's KB, marks resolved, logs a **retrain action** (this is the Pro "continuous retraining" promise); prioritise Pro clients; drill into the failed conversations; surface failed KB uploads here.

**Staff & audit:** remove/deactivate staff + change role via email invite; audit log filters (date/action/search) + pagination + export + before/after detail; last-login/2FA status.

**Cross-cutting:** every attention/list item routes to the right place; owner notifications (email/push) for urgent events (failed payment, trial ending, overdue call); wire real Stripe for billing actions later.
