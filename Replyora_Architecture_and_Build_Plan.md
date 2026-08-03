# Replyora — Product & Technical Architecture

**An AI customer-conversation platform for small & medium service businesses.**
Reference product: Chatbase. Difference: Replyora doesn't just answer — it *replies instantly, captures leads, qualifies enquiries, and books customers 24/7*, as a multi-tenant SaaS.

Stack: Next.js (App Router) · TypeScript · Tailwind · Supabase (auth/DB/storage + pgvector) · Claude or OpenAI API · Stripe · Vercel.

---

## 1. Product overview

Replyora is a **multi-tenant SaaS** where each business gets an isolated workspace containing its own knowledge base, assistant configuration, conversations, and leads. A business owner signs up, describes their business, uploads their info, trains an assistant, customises it, previews it, and drops an embed snippet on their site. From then on the assistant handles website visitors — answering from the business's own content, capturing contact details, qualifying intent, and pushing toward a booking.

**What makes it different from a "chatbot builder":**
- **Outcome = revenue, not deflection.** Every conversation is steered toward capturing a lead and booking, not just closing a ticket.
- **Lead engine built in.** Structured lead capture + qualification + a leads inbox are first-class, not an afterthought.
- **Done-for-you friendly.** The setup flow is simple enough that you (or the owner) can stand up a trained assistant in minutes.
- **Brand-voice native.** Tone, colours, welcome message and persona are core config.

**Primary persona:** owner/admin of a salon, physio/allied-health clinic, real-estate agency, NDIS provider, trades business, gym, etc. Non-technical, time-poor, lives in their DMs.

**Core value loop:** Visitor asks → assistant answers from KB → assistant qualifies & captures contact → lead lands in dashboard → owner books the customer.

---

## 2. User flow

**Owner/admin onboarding**
1. Land on marketing site → "Build your assistant free."
2. Sign up (email+password or Google OAuth via Supabase).
3. Workspace auto-created; pick business name → enters dashboard.
4. **Business profile:** industry, description, website, phone, email, address, opening hours, timezone.
5. **Knowledge base:** paste FAQs/services/pricing/policies, upload PDFs/docs, add website URLs to crawl. System ingests → embeds → marks "ready."
6. **Assistant config:** name, tone, brand colour, welcome message, suggested questions, which lead fields to collect, escalation rule.
7. **Preview** in an in-dashboard sandbox; iterate on KB/config.
8. **Install:** copy the embed snippet (or share a hosted link).
9. **Subscribe:** choose a plan (Stripe Checkout). Free tier works immediately with caps.
10. Ongoing: watch **Conversations** and **Leads**, refine KB, manage team & billing.

**Website visitor flow**
1. Visitor loads a customer's site → Replyora bubble appears.
2. Opens widget → sees welcome message + suggested questions.
3. Asks a question → assistant retrieves from that workspace's KB → streams an on-brand answer.
4. At the right moment the assistant asks for name/email/phone and qualifying details.
5. Lead is saved; conversation transcript stored; optional booking-link/handoff offered.

---

## 3. Feature list (full vision)

**Workspace & accounts:** multi-tenant workspaces, team members & roles (owner/admin/member), invitations, profile.
**Business profile:** structured fields + hours + timezone used in answers ("are you open Saturday?").
**Knowledge base:** manual text, FAQ pairs, services & pricing, policies, file upload (PDF/DOCX/TXT/MD), website URL crawl, re-index, per-source status, delete/refresh.
**Assistant:** persona/tone, system-prompt builder, model choice, temperature, welcome message, suggested prompts, branding (colours, avatar, name), multi-language, fallback/escalation behaviour.
**Chat runtime:** RAG answers with citations, streaming, conversation memory, rate limiting, profanity/guardrails, "talk to a human" handoff/email.
**Lead capture & qualification:** configurable fields, inline forms, intent detection, qualification scoring, lead statuses (new/qualified/booked/lost), export CSV, email/Slack notifications, booking-link or Calendly handoff.
**Widget & embed:** one-line script, iframe + shadow-DOM isolation, domain allowlist, position/colour theming, mobile responsive.
**Analytics:** conversations, messages, leads, top questions, deflection vs capture, response time.
**Billing:** plans, usage metering, upgrade/downgrade, customer portal, branding removal as paid feature.
**Admin settings:** workspace settings, members, API keys, billing, danger zone (delete workspace), data export.

---

## 4. MVP scope

Ship the loop end-to-end; defer the nice-to-haves.

**In MVP**
- Landing page (value prop, pricing, CTA).
- Auth (email/password + Google) + auto workspace creation.
- Dashboard shell with nav.
- Business profile setup (single form).
- Knowledge base: manual text + FAQ + **file upload (PDF/TXT/DOCX)** + ingestion → embeddings.
- Assistant config: name, tone, brand colour, welcome message, lead fields.
- RAG chat (Claude/OpenAI) with streaming, scoped to workspace.
- In-dashboard preview.
- Embeddable widget + embed script + public chat endpoint.
- Conversation history (list + transcript).
- Lead capture (collect name/email/phone, store, leads list, email notification).
- Stripe subscriptions with 3 plans + **plan gating** (message cap, KB size, branding).
- Admin settings: profile, members (basic), billing portal.

**Defer (v1.1+):** website URL crawler, multi-language, advanced analytics dashboards, Slack/WhatsApp/IG channels, A/B persona testing, Calendly deep integration, API for customers, white-label domains, team RBAC beyond owner/admin.

**MVP definition of done:** a real business can sign up, train on a PDF + FAQs, customise, paste the snippet on a live site, and you can watch a visitor get answered and a lead appear — all isolated per tenant, with billing enforced.

---

## 5. Database schema (Postgres / Supabase, with pgvector)

Tenant key everywhere is `workspace_id`. Enable `pgvector`. All tenant tables get RLS (Section 11).

```sql
-- extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- tenants
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  owner_id uuid not null references auth.users,
  plan text not null default 'free',            -- free|starter|growth|pro
  plan_status text not null default 'active',    -- active|past_due|canceled
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'member',           -- owner|admin|member
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- business profile (1:1 with workspace)
create table business_profiles (
  workspace_id uuid primary key references workspaces on delete cascade,
  industry text, description text, website text,
  phone text, email text, address text,
  hours jsonb,            -- { mon:{open,close}, ... }
  timezone text default 'Australia/Sydney',
  updated_at timestamptz default now()
);

-- knowledge sources (a file, FAQ set, pasted text, or URL)
create table knowledge_sources (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces on delete cascade,
  type text not null,         -- text|faq|file|url|pricing|service
  title text,
  storage_path text,          -- for files in Supabase Storage
  status text not null default 'pending',  -- pending|processing|ready|failed
  error text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- chunked + embedded content for RAG
create table knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces on delete cascade,
  source_id uuid not null references knowledge_sources on delete cascade,
  content text not null,
  embedding vector(1536),     -- text-embedding-3-small
  token_count int,
  metadata jsonb,
  created_at timestamptz default now()
);
create index on knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on knowledge_chunks (workspace_id);

-- assistant config (1 per workspace in MVP)
create table assistants (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces on delete cascade,
  public_key text unique not null,    -- used by the widget
  name text default 'Assistant',
  tone text default 'friendly',
  system_prompt text,
  model text default 'claude-haiku',
  temperature numeric default 0.3,
  brand_color text default '#5C1A1A',
  welcome_message text,
  suggested_questions jsonb,
  lead_fields jsonb,                  -- [{key:'email',required:true},...]
  allowed_domains text[],             -- domain allowlist for the widget
  status text default 'active',
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces on delete cascade,
  assistant_id uuid references assistants on delete set null,
  visitor_id text,                    -- anon id from widget localStorage
  channel text default 'web',
  page_url text,
  status text default 'open',
  started_at timestamptz default now(),
  last_message_at timestamptz default now()
);
create index on conversations (workspace_id);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations on delete cascade,
  workspace_id uuid not null references workspaces on delete cascade,
  role text not null,                 -- user|assistant|system
  content text not null,
  citations jsonb,
  tokens int,
  created_at timestamptz default now()
);
create index on messages (conversation_id);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces on delete cascade,
  conversation_id uuid references conversations on delete set null,
  name text, email text, phone text,
  intent text,
  qualification jsonb,
  status text default 'new',          -- new|qualified|booked|lost
  created_at timestamptz default now()
);
create index on leads (workspace_id);

-- usage metering per billing period
create table usage_counters (
  workspace_id uuid references workspaces on delete cascade,
  period_start date not null,
  messages_used int default 0,
  leads_count int default 0,
  primary key (workspace_id, period_start)
);

-- stripe webhook idempotency
create table stripe_events (
  id text primary key,
  type text,
  processed_at timestamptz default now()
);

-- audit trail
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces on delete cascade,
  actor_id uuid,
  action text, target text, metadata jsonb,
  created_at timestamptz default now()
);
```

A Postgres function powers vector search (called via RPC, always filtered by tenant):

```sql
create or replace function match_chunks(
  p_workspace uuid, p_query vector(1536), p_match_count int default 6
) returns table (content text, similarity float, metadata jsonb)
language sql stable as $$
  select content, 1 - (embedding <=> p_query) as similarity, metadata
  from knowledge_chunks
  where workspace_id = p_workspace
  order by embedding <=> p_query
  limit p_match_count;
$$;
```

---

## 6. API routes (Next.js App Router route handlers)

Authenticated routes derive `workspace_id` from the session — **never** from the request body.

```
Auth (Supabase client + middleware)
  /auth/callback                 OAuth callback

Workspace & profile
  GET/PATCH  /api/workspace      current workspace
  GET/PATCH  /api/business-profile
  GET/POST   /api/members        list/invite (admin)

Knowledge base
  GET        /api/knowledge          list sources + status
  POST       /api/knowledge          create text/faq source
  POST       /api/knowledge/upload   signed upload + create file source
  POST       /api/knowledge/ingest   (internal/queued) parse→chunk→embed
  DELETE     /api/knowledge/:id

Assistant
  GET/PATCH  /api/assistant       config (tone, branding, lead fields, domains)
  POST       /api/assistant/preview  authenticated test chat

Public chat runtime (no user session; keyed by public_key)
  POST       /api/chat            { publicKey, conversationId?, visitorId, message } -> SSE stream
  POST       /api/lead            { publicKey, conversationId, fields }
  GET        /widget/:publicKey   hosted widget page (iframe target)
  GET        /embed.js            widget loader script

Inbox
  GET        /api/conversations              list
  GET        /api/conversations/:id          transcript
  GET        /api/leads                       list/filter
  PATCH      /api/leads/:id                   update status

Billing
  POST       /api/stripe/checkout    create Checkout session
  POST       /api/stripe/portal      billing portal link
  POST       /api/stripe/webhook     verify signature, update plan/usage
  GET        /api/usage              current usage vs limits
```

Public `/api/chat` is the security-sensitive one: validate `public_key` → resolve workspace+assistant → check request `Origin` against `allowed_domains` → rate-limit by IP/visitor → enforce plan message cap → run RAG → stream → persist messages. Use the Supabase **service role** here (RLS bypass) but scope every query by the resolved `workspace_id`.

---

## 7. Folder structure

```
replyora/
├─ app/
│  ├─ (marketing)/               # public site
│  │  ├─ page.tsx                # landing
│  │  └─ pricing/page.tsx
│  ├─ (auth)/login, /signup
│  ├─ (dashboard)/
│  │  ├─ layout.tsx              # sidebar, workspace guard
│  │  ├─ page.tsx                # overview
│  │  ├─ knowledge/              # KB manager
│  │  ├─ assistant/              # config + preview
│  │  ├─ conversations/
│  │  ├─ leads/
│  │  ├─ install/                # embed snippet
│  │  └─ settings/               # profile, members, billing
│  ├─ widget/[publicKey]/page.tsx  # hosted widget UI (iframe)
│  └─ api/                       # route handlers (Section 6)
├─ components/
│  ├─ ui/                        # buttons, inputs (shadcn/ui)
│  ├─ dashboard/
│  └─ widget/                    # chat UI shared by preview + widget
├─ lib/
│  ├─ supabase/                  # server, client, admin (service role)
│  ├─ ai/                        # llm.ts, embeddings.ts, rag.ts, prompts.ts
│  ├─ ingest/                    # parse.ts, chunk.ts
│  ├─ stripe/                    # client.ts, plans.ts, webhook.ts
│  ├─ auth/                      # session, workspace helpers
│  ├─ rate-limit.ts
│  └─ usage.ts                   # plan gating
├─ public/embed.js               # loader script (or served via route)
├─ supabase/migrations/          # SQL + RLS policies
├─ types/                        # db types (supabase gen types)
├─ middleware.ts                 # auth + workspace routing
└─ .env.local
```

---

## 8. Chat widget architecture

Goal: a **one-line, isolated, secure** embed that works on any site without CSS/JS collisions.

**Embed snippet the customer pastes:**
```html
<script src="https://app.replyora.com/embed.js" data-key="PUBLIC_KEY" async></script>
```

**How it works:**
1. `embed.js` is a tiny (~5 KB) vanilla loader. It reads `data-key`, creates a floating bubble button, and injects an **iframe** pointing to `https://app.replyora.com/widget/PUBLIC_KEY`.
2. The iframe renders the full chat UI (React) — this gives **hard style + script isolation** from the host page (no Tailwind leakage either way). The bubble itself lives in a **shadow DOM** so it can't be styled by the host.
3. Loader ↔ iframe communicate via `postMessage` (open/close, resize, unread badge).
4. The widget UI calls `POST /api/chat` with `publicKey`, a `visitorId` (persisted in `localStorage`), and the `conversationId`. Responses **stream** via SSE so text appears token-by-token.
5. Lead forms render inline in the widget; submit to `/api/lead`.

**Security at the edge:** the `/api/chat` handler checks the request `Origin`/`Referer` against the assistant's `allowed_domains`, rate-limits per visitor/IP, and enforces the plan's monthly message cap before calling the model. The public key is safe to expose (it only grants scoped, rate-limited chat — never DB access).

**Reuse:** the in-dashboard **Preview** uses the same `components/widget` chat UI, just pointed at `/api/assistant/preview` (authenticated) instead of the public endpoint.

---

## 9. Knowledge base / training system (RAG)

"Training" here = **retrieval-augmented generation**, not fine-tuning. The assistant stays a base model; the business's knowledge is injected at query time.

**Ingestion pipeline (per source):**
1. **Capture** — pasted text, FAQ pairs, uploaded file (Supabase Storage), or URL.
2. **Extract** — PDF/DOCX/TXT → plain text (`pdf-parse`, `mammoth`); URL → readable text.
3. **Chunk** — ~500–800 tokens with ~15% overlap; keep FAQ pairs intact; attach metadata (source title, type).
4. **Embed** — `text-embedding-3-small` (1536-dim) per chunk.
5. **Store** — insert into `knowledge_chunks` with `workspace_id`; mark source `ready`.
6. Run as a **background job** (Supabase Edge Function, Inngest, or a Vercel queue) so uploads don't block the UI; update `status` for live progress.

**Query pipeline (per visitor message):**
1. Embed the user message (+ light history for context).
2. `match_chunks(workspace_id, query_embedding, k=6)` — **always tenant-filtered**.
3. Assemble prompt: system prompt (persona/tone/rules + business profile + hours) → retrieved context → recent conversation → user message.
4. Call the LLM (Claude/OpenAI) with **streaming**.
5. Apply guardrails: answer only from context + profile; if unknown, say so and offer to capture details / escalate; never invent pricing.
6. Persist user+assistant messages; attach citations; detect lead intent → trigger capture.

**Prompt skeleton:**
```
You are {assistant_name}, the assistant for {business_name} ({industry}).
Tone: {tone}. Reply concisely and in brand voice.
Use ONLY the CONTEXT and business profile below. If the answer isn't there,
say you'll have the team follow up and offer to take their details.
Never invent prices, availability, or policies.
When the visitor shows buying intent, collect: {lead_fields}.
BUSINESS PROFILE: {hours, phone, address, website}
CONTEXT: {retrieved_chunks}
```

**Re-indexing:** deleting/editing a source removes/replaces its chunks. Keep ingestion idempotent (hash chunks).

---

## 10. Subscription / package structure

Stripe Products → Prices (monthly + annual). Webhook keeps `workspaces.plan` / `plan_status` in sync. Gating reads plan limits + `usage_counters`.

| | Free | Starter | Growth | Pro |
|---|---|---|---|---|
| Price (AUD/mo) | $0 | ~$49 | ~$99 | ~$199 |
| Messages / mo | 100 | 1,000 | 5,000 | 20,000 |
| Knowledge size | 1 MB | 25 MB | 100 MB | 500 MB |
| Assistants | 1 | 1 | 3 | 10 |
| Lead capture | ✓ | ✓ | ✓ | ✓ |
| Team seats | 1 | 2 | 5 | 15 |
| Remove "Powered by Replyora" | — | — | ✓ | ✓ |
| Channels beyond web | — | — | WhatsApp/IG | all |
| Analytics | basic | basic | advanced | advanced |
| Support | community | email | priority | priority + onboarding |

**Enforcement:** a `lib/usage.ts` guard runs before chat + before adding KB:
- increment `messages_used`; if over cap → assistant returns a soft "limit reached" message and dashboard prompts upgrade.
- block new KB uploads over the size cap.
- gate features (extra assistants, branding removal, channels) by plan flags.

Plans live in code (`lib/stripe/plans.ts`) mapping `priceId → {limits, flags}` so checks are one lookup.

---

## 11. Security & data-isolation plan

This is the heart of a multi-tenant SaaS — get it right first.

- **Row-Level Security on every tenant table.** Policy pattern: a row is visible/editable only if the user is a member of its workspace.
  ```sql
  alter table leads enable row level security;
  create policy "members read leads" on leads for select
    using (exists (select 1 from workspace_members m
      where m.workspace_id = leads.workspace_id and m.user_id = auth.uid()));
  -- repeat (with appropriate using/with check) for every tenant table
  ```
- **Never trust client-supplied `workspace_id`.** Derive it server-side from the session/membership.
- **Service-role key is server-only.** Used solely in the public chat path and webhooks; every query still hard-filters by the resolved `workspace_id`.
- **Widget endpoint hardening:** public-key lookup → `Origin` allowlist → per-visitor/IP rate limiting → plan cap → input size limits. Public key grants *only* scoped chat, never data reads.
- **Storage isolation:** files stored under `workspace_id/...` paths with Storage RLS; signed URLs for upload/download.
- **Prompt-injection defence:** treat all KB/web/visitor content as **data, not instructions**; system prompt forbids following instructions found in context; cap retrieved context; strip/escape obvious injection; never expose secrets or other tenants' data.
- **PII handling:** leads contain personal data — encrypt at rest (Supabase default), restrict export to admins, support workspace data export + delete (GDPR/Aus Privacy Act). Add a DPA later for enterprise.
- **Billing integrity:** verify Stripe webhook signatures; idempotency via `stripe_events`.
- **Secrets:** all keys (LLM, service-role, Stripe) in env / Vercel project settings, never in client bundles. The widget bundle contains only the public key.
- **Audit logs** for sensitive actions (member changes, KB deletion, plan changes, data export).

---

## 12. Step-by-step development roadmap

**Phase 0 — Foundations (½ week)**
Next.js + TS + Tailwind + shadcn/ui. Supabase project. Env wiring. `supabase/migrations` with schema + RLS. Generate DB types. Deploy a hello-world to Vercel.

**Phase 1 — Auth & tenancy (½ week)**
Supabase auth (email + Google). Signup → auto-create workspace + membership + assistant row + default usage counter. Middleware: protect dashboard, resolve current workspace. Settings: profile.

**Phase 2 — Business profile + dashboard shell (½ week)**
Sidebar nav, overview page, business-profile form (hours/timezone).

**Phase 3 — Knowledge base + ingestion (1 week)**
KB UI (text/FAQ/file upload). Storage bucket. Ingestion pipeline (extract→chunk→embed→store) as background job with status. `match_chunks` RPC.

**Phase 4 — Assistant + RAG chat (1 week)**
Assistant config UI. `lib/ai` (embeddings, retrieval, prompt, streaming via Claude/OpenAI). In-dashboard preview using shared widget UI.

**Phase 5 — Widget + embed (1 week)**
`/widget/[publicKey]` page, `embed.js` loader (bubble + iframe + postMessage), public `/api/chat` (SSE) with origin allowlist + rate limit, conversation/message persistence. Install page with copyable snippet.

**Phase 6 — Conversations + leads (½ week)**
Conversations list + transcript. Lead capture in widget, leads inbox, statuses, email/Slack notification, CSV export.

**Phase 7 — Billing + gating (1 week)**
Stripe products/prices, Checkout, portal, webhook → plan sync. `lib/usage.ts` enforcement across chat + KB + features. Usage UI + upgrade prompts.

**Phase 8 — Landing page + polish + launch (½–1 week)**
Marketing site + pricing, on-brand styling (your burgundy/oat kit), empty states, error handling, analytics, security review, seed a real pilot business, go live.

**Total MVP: ~6–7 focused weeks.** Build vertically — get one tenant fully working end-to-end (Phases 1→6) before perfecting billing and marketing.

---

## 13. How to actually build this with Claude (code side, step by step)

You'll drive this with **Claude Code** (the terminal/IDE agent) — it can scaffold files, run commands, write migrations, and iterate. Work in **small, verifiable slices**, one phase at a time. Here's the exact sequence.

**A. Set up the workshop**
1. Install Node 20+, the GitHub CLI, and Claude Code. Create an empty repo `replyora` and open it in your editor.
2. Create accounts/keys: Supabase project, Stripe (test mode), Anthropic or OpenAI API key, Vercel.
3. In the repo, create a **`CLAUDE.md`** at the root — paste a condensed version of this document (stack, schema, security rules, folder structure). Claude Code reads this on every run, so it stays on-architecture. Add house rules: "multi-tenant, RLS on every table, never trust client workspace_id, derive from session, TypeScript strict."

**B. Give Claude the plan, then go phase by phase**
4. Start each session by telling Claude which phase you're on and to propose a short plan before coding. Example first prompt:
   > "Read CLAUDE.md. We're on Phase 0. Scaffold a Next.js (App Router) + TypeScript + Tailwind + shadcn/ui project, add the Supabase server/client/admin helpers in `lib/supabase`, and create `supabase/migrations/0001_init.sql` with the schema and RLS from CLAUDE.md. Don't build features yet. Show me the plan first."
5. Review its plan, approve, let it write. Then **run it yourself**: `npm run dev`, apply migrations (`supabase db push` or paste SQL in the Supabase SQL editor), and confirm it works before moving on.

**C. Repeat the loop for each phase (1→8)**
6. One feature per prompt. e.g. Phase 1:
   > "Phase 1: implement Supabase auth (email + Google), and on first login create a workspace + workspace_members(owner) + default assistant + usage_counter in a transaction. Add middleware that protects `/dashboard` and resolves the current workspace. Write it, then tell me how to test it."
7. After each phase, ask Claude to **add a quick test or a manual test checklist**, and verify the tenant isolation by signing up two accounts and confirming they can't see each other's data.
8. Keep changes in small git commits ("phase 1: auth + workspace bootstrap") so you can roll back.

**D. The AI + RAG slice (Phase 3–4) — be explicit**
9. Tell Claude exactly which provider and models: embeddings model, chat model, and that retrieval must call `match_chunks` filtered by `workspace_id`, with streaming responses. Have it put all AI logic in `lib/ai` so it's swappable (Claude ↔ OpenAI).
10. Test with a real PDF: upload → confirm chunks/embeddings exist in `knowledge_chunks` → ask a question in Preview → confirm the answer cites your doc.

**E. The widget slice (Phase 5) — test cross-site**
11. Ask Claude to build `embed.js` + the `/widget/[publicKey]` iframe page + the public `/api/chat` SSE route with origin allowlist + rate limiting. Then create a throwaway `test.html` on a different local port and paste the snippet to confirm isolation and streaming work off-domain.

**F. Billing slice (Phase 7) — use Stripe test mode + CLI**
12. Have Claude define plans in `lib/stripe/plans.ts`, build Checkout/portal/webhook, and wire `lib/usage.ts` gating. Use the **Stripe CLI** to forward webhooks locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) and trigger test events. Verify a plan upgrade flips limits.

**G. Ship**
13. Push to GitHub, import into Vercel, set all env vars in Vercel (server-only secrets), point Stripe live webhook at the deployed URL, run the migration on prod Supabase, and smoke-test the whole loop on a real domain.

**Working tips for Claude Code:** keep `CLAUDE.md` updated as the source of truth; ask for a plan before large changes; make it write DB types after every migration (`supabase gen types typescript`); after each phase ask "what did you change and how do I test it?"; and periodically run a **security pass** ("audit every API route: is workspace_id derived from session, is RLS relied on, any service-role query missing a tenant filter?").

---

*Built for Replyora — burgundy & oat. Design first, then code in vertical slices.*
