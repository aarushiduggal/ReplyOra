# Replyora — Go Live (free-tier path)

Goal: take Replyora from the local mock version to a **real, working product online**, starting on **free tiers**, and paying for bigger servers only once you outgrow them.

**The only real cost to start:** a few dollars of AI credit (pay-as-you-go, cents per conversation). Everything else is free until you scale. Stripe only charges a % when you actually get paid.

---

## Part 1 — Create the free accounts (you do this)

Create each account, then paste its keys into `.env.local` (copy from `.env.example`). **Never share these keys in chat or commit them to GitHub.**

| # | Account | Free tier | Keys you'll get → put in `.env.local` |
|---|---------|-----------|----------------------------------------|
| 1 | **GitHub** (github.com) | Free | — (used to store code) |
| 2 | **Supabase** (supabase.com) | Free | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 3 | **Anthropic** (console.anthropic.com) | Pay-as-you-go — add ~$5–$20 credit | `ANTHROPIC_API_KEY` |
| 4 | **OpenAI** (platform.openai.com) | Pay-as-you-go — add ~$5 credit (embeddings are cents) | `OPENAI_API_KEY` |
| 5 | **Stripe** (stripe.com) | Free; start in **Test mode** | `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET`, the 3 price IDs |
| 6 | **Vercel** (vercel.com) | Free Hobby | — (hosting; add the env vars here at deploy) |

> Tip: do steps 1–2 first (they unblock the most build work). You can add Anthropic/OpenAI/Stripe keys as you reach those phases.

---

## Part 2 — Wire the real backend with Claude Code (phase by phase)

Do these **in order**. After each, run it and test before moving on. Paste each prompt into Claude Code as you go.

### Phase 1 — Auth + database (Supabase)
> Read CLAUDE.md. We're moving off the mock data layer to **real Supabase**. Do Phase 1: wire Supabase auth (email + Google), replace the mock auth/session, and make first login auto-create the workspace + owner membership + assistant + usage row. Apply `supabase/migrations/0001_init.sql` to my Supabase project (guide me if you can't run it directly — I'll paste it into the Supabase SQL editor). Add `middleware.ts` to protect `/dashboard` and resolve the current workspace. Generate DB types. Show the plan first, then tell me exactly how to test, including signing up two accounts to confirm tenant isolation (RLS).

### Phase 2 — Business profile + dashboard on real data
> Phase 2: switch the business-profile form and dashboard to read/write real Supabase data for the signed-in workspace (no more mock). Keep RLS-safe (derive workspace_id from the session). Tell me how to test.

### Phase 3 — Knowledge base + ingestion (real files + embeddings)
> Phase 3: implement real knowledge ingestion. File upload to Supabase Storage (bucket `kb`, per-workspace paths), extract text (PDF/DOCX/TXT), chunk (~500–800 tokens, 15% overlap), embed with OpenAI `text-embedding-3-small`, and store in `knowledge_chunks` with the source status lifecycle (pending→processing→ready/failed). Run ingestion as a background job so uploads don't block the UI. Tell me how to test with a real PDF.

### Phase 4 — AI chat / RAG (real Claude replies)
> Phase 4: implement real RAG. Embed the user message, call `match_chunks` (always filtered by workspace_id), build the prompt (persona + business profile + retrieved context + history), and stream replies from the Anthropic Claude API. Enforce the guardrails in CLAUDE.md (answer only from context, capture leads on buying intent). Wire the in-dashboard preview to this. Tell me how to test.

### Phase 5 — Widget + embed (public, secure)
> Phase 5: build the public widget. `embed.js` loader (shadow-DOM bubble + iframe to `/widget/[publicKey]`), the public `/api/chat` SSE route with origin allowlist + rate limiting + plan cap, and message/conversation persistence. Give me the install snippet and a `test.html` to confirm it works on a different origin.

### Phase 6 — Conversations + leads (real inbox)
> Phase 6: make conversations and leads real — list + transcript, lead capture from the widget, statuses (new/qualified/booked/lost), CSV export, and an email notification on new lead. Tell me how to test.

### Phase 7 — Billing (Stripe, test mode)
> Phase 7: implement Stripe billing in **test mode** matching CLAUDE.md — no free plan; Starter $250 / Growth $300 (Most Popular) / Pro $390; a one-time $250 setup fee on the first invoice; 7-day trial then pay-to-continue. Build checkout, billing portal, and the webhook (verify signatures, idempotent via stripe_events, sync workspaces.plan/plan_status). Enforce limits in `lib/usage.ts`. Show me how to test with the Stripe CLI and test cards.

**Test after every phase.** Especially: sign up two accounts and confirm they cannot see each other's data.

---

## Part 3 — Deploy to Vercel (free)

Once it works locally end-to-end:

1. **Push to GitHub.** In Claude Code: *"initialize git, add a .gitignore (node_modules, .env*, .next), commit, and push to my GitHub repo [paste URL]."* Confirm `.env.local` is **not** committed.
2. **Import to Vercel.** vercel.com → Add New → Project → import the `replyora` repo → it auto-detects Next.js.
3. **Add environment variables in Vercel** (Project → Settings → Environment Variables): every key from `.env.local` (Supabase, Anthropic, OpenAI, Stripe, `NEXT_PUBLIC_APP_URL` = your Vercel URL). Server secrets stay server-side automatically.
4. **Deploy.** ~2 minutes → you get a live URL like `replyora.vercel.app`.
5. **Run the migration on production Supabase** (same `0001_init.sql`) if you used a separate prod project.
6. **Point the Stripe webhook** at `https://<your-vercel-url>/api/stripe/webhook` and paste the resulting signing secret into Vercel env.
7. **Smoke-test the live site:** sign up, add a knowledge source, chat, capture a lead, run a test checkout.

You're live — for free.

---

## Part 4 — When to start paying (later, only as you grow)

| Trigger | Upgrade | Rough cost |
|---|---|---|
| More traffic / build minutes / team | **Vercel Pro** | ~$20/mo |
| Outgrow free DB/storage/users | **Supabase Pro** | ~$25/mo |
| Want your own domain | Buy `replyora.com`, add in Vercel | ~$10–20/yr |
| Taking **real** customer money | Switch Stripe to **live mode** (needs business/bank details) | Stripe fee per transaction only |
| More conversations | AI usage rises (still pay-as-you-go) | scales with use |

AI credit (Anthropic + OpenAI) is the one ongoing cost from day one, but it's usage-based and small until you have real volume.

---

## Important flags

- **Real customer money = live Stripe = business details.** You can build & test everything now in Stripe test mode. Taking actual payments needs live mode, which ties to registering your entity at proper launch.
- **You'll be holding other businesses' customers' personal data.** Before real users, get the Privacy Policy / Terms reviewed by a lawyer and finish the entity/ABN at launch (see `content/legal/`).
- **Never commit secrets.** Keys live in `.env.local` (local) and Vercel env settings (prod) — never in the repo or in chat.
