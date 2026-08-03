# Replyora

An AI customer-conversation platform for small & medium service businesses.
The assistant replies instantly, captures leads, qualifies enquiries, and books
customers 24/7 — multi-tenant SaaS, one isolated workspace per business.

Architecture and house rules live in [`CLAUDE.md`](./CLAUDE.md). Read it first.
Packages/pricing: [`PACKAGES.md`](./PACKAGES.md). Staff portal: [`ADMIN_PORTAL.md`](./ADMIN_PORTAL.md).

**Stack:** Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui + framer-motion + Lenis · Supabase (auth/Postgres/storage + pgvector) ·
Anthropic Claude · Stripe · Vercel.

---

## Live

Deployed at **https://replyora-starter.vercel.app**. In production it runs on
**real Supabase auth** (email + Google), auto-provisions an empty workspace per
signup, and routes new users through the onboarding wizard. Locally it runs on
the in-memory **mock** layer (below) unless Supabase env vars are set.

**Mode flag:** `USE_SUPABASE` (`lib/data/mode.ts`) — live when
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present (and
`NEXT_PUBLIC_USE_MOCK !== "1"`), else mock.

### Feature status
- **Plans & gating** — Starter/Growth/Pro (+$250 setup, 7-day trial); flags + caps in `lib/stripe/plans.ts`, enforced in `lib/usage.ts`. Website-embed widget only.
- **Stage 2 engines** (built, plan-gated): booking + calendar, human handoff, remove-branding, abandoned recovery, review engine, no-show reduction, lead win-back, continuous retraining.
- **Staff portal** `/admin` — apply `supabase/migrations/0002_platform_admin.sql`, add yourself to `platform_admins`.
- **Claude AI** (`lib/ai/llm.ts`) — dormant behind `HAS_ANTHROPIC`; set `ANTHROPIC_API_KEY`.
- **Stripe billing** (`lib/stripe/server.ts` + `/api/stripe/*`) — dormant behind `HAS_STRIPE`; set the keys below.

### Environment variables
```
# Supabase (live auth + data)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only (chat path, admin, webhooks)
NEXT_PUBLIC_APP_URL=              # e.g. https://replyora-starter.vercel.app
# AI (optional — dormant until set)
ANTHROPIC_API_KEY=
# Stripe (optional — dormant until set)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_PRO=
STRIPE_PRICE_SETUP=               # one-time $250 setup fee price
```

---

## Current state — clickable prototype (no external accounts)

The whole app runs on a **mock data layer** — no Supabase, Stripe, or AI keys
required. Sign-in is faked, data is seeded in-memory for one demo tenant
("Coastal Glow Skin Clinic"), and chat replies stream from a canned generator.
Every seam is shaped like the real architecture with a `// TODO: replace with
Supabase / Claude / Stripe` comment, so wiring the real services later is a
drop-in change.

**Screens you can click through:**

- `/` — marketing landing (hero, value props, pricing, CTA)
- `/login`, `/signup` — fake auth that drops you into the dashboard
- `/dashboard` — overview (stats, recent conversations, usage, latest leads)
- `/dashboard/business` — business profile + opening-hours form
- `/dashboard/knowledge` — add text/FAQ, file-upload UI, source list with status
- `/dashboard/assistant` — persona/branding/lead-field config with a **live
  preview chat** (replies stream)
- `/dashboard/conversations` + `/dashboard/conversations/[id]` — inbox + transcript
- `/dashboard/leads` — leads table with status filters, inline status change, CSV export
- `/dashboard/install` — embed snippet + a live floating-bubble widget demo
- `/dashboard/settings` — profile / members / plan & billing (all mocked)
- `/widget/[publicKey]` — the hosted widget UI (iframe target)

### Where the mock layer lives

| Concern | File(s) | Swap target |
|---|---|---|
| Seed data | `lib/data/seed.ts` | Supabase rows |
| Data access | `lib/data/*.ts` | Supabase queries |
| Auth | `lib/auth/session.ts` | `supabase.auth` |
| AI chat | `lib/ai/mock.ts` + `app/api/chat/route.ts` | Claude + `match_chunks` |
| Billing | `lib/data/seed.ts` (`PLANS`) | `lib/stripe/plans.ts` |

Mutations (saving a form, changing a lead status, adding a source) update local
React state so the UI feels live, but are **not persisted across reload** — there's
no database yet. That's the only prototype caveat.

---

## Run it

No configuration needed — just:

```bash
npm install
npm run dev      # http://localhost:3000
```

> Requires **Node.js 20+** (`node --version`). Install from <https://nodejs.org>
> or via `nvm` if you don't have it.

### Optional: wire the real backend later

`.env.example` lists every key you'll add when connecting Supabase / Anthropic /
Stripe. Until then the app ignores them. The Phase 0 `lib/supabase/*` helpers and
`supabase/migrations/0001_init.sql` (full schema + RLS + tenant bootstrap +
`match_chunks`) are ready for that step. `types/db.ts` is a hand-authored stub
mirroring the migration; regenerate it with `npm run gen:types` once your project
is linked.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run gen:types` | Regenerate `types/db.ts` from the linked Supabase project |

## Adding shadcn/ui components

The foundation (`components.json`, `lib/utils.ts`, a `Button`) is in place. Add more with:

```bash
npx shadcn@latest add input card dialog
```

## Deploy (hello-world to Vercel)

1. Push this repo to GitHub.
2. Import it into Vercel; set the project root to `replyora-starter/` if the repo
   contains the planning docs at its root.
3. Add the env vars from `.env.local` to the Vercel project (server secrets stay
   server-only — do not prefix them with `NEXT_PUBLIC_`).
4. Deploy and confirm the landing page renders.

---

## Next: Phase 1 — Auth & tenancy

Supabase auth (email + Google) → on first login auto-create workspace + owner
membership + assistant + usage counter (the `handle_new_user()` trigger in the
migration already does this DB-side). Add middleware route protection + workspace
resolution, then verify tenant isolation by signing up two accounts.
