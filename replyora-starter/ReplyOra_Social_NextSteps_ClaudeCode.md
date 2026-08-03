# ReplyOra Social — Next Steps (copy-paste into Claude Code)

How to use this:
1. Open the `replyora-starter` folder in **Claude Code** (`claude` in your terminal).
2. Copy each **PROMPT** block below (the grey box) and paste it in, **in order**.
3. After each one, do the **Test** and only move on when it passes.
4. Steps marked **YOU DO THIS** are things only you can do (create a free account, paste a key).

Everything here is free. Order: **Milestone 1 (deploy) → Milestone 2 (login) → Milestone 3 (AI + publishing).**

---

## MILESTONE 1 — Get it online (free, public, never expires)

### YOU DO THIS — create 3 free accounts
GitHub (github.com), Neon (neon.tech), Netlify (netlify.com). Details are in `ReplyOra_Social_GoLive_Netlify_Neon.md`.

### PROMPT 1 — prep the repo for Netlify + Neon

```
Read ReplyOra_Social_GoLive_Netlify_Neon.md and lib/social/store.ts so you understand the setup. We are deploying this Next.js app to Netlify with a Neon Postgres database, and NOT using Vercel or Supabase for the social features.

Do this:
1. Add a netlify.toml configured for Next.js (build command "next build", install the @netlify/plugin-nextjs plugin).
2. Add DATABASE_URL and NEXT_PUBLIC_APP_URL to .env.example with comments.
3. Make sure the app builds with `npm run build` and that lib/social/store.ts uses Neon when DATABASE_URL is set and in-memory when it isn't (it already should — just verify).
4. Show me exactly what to do next in Netlify's dashboard, and how to run db/migrations/0001_social_posts.sql in Neon.

Then tell me how to test.
```

**Test:** `npm run build` succeeds. Then follow the guide to deploy — you get a public `…netlify.app` URL, and posts you create in Content Studio save to Neon.

---

## MILESTONE 2 — Real login (swap Supabase → Auth.js, free)

This is what lets real people **sign up and log in** on the live site. All code — no new paid accounts.

### YOU DO THIS — generate an auth secret
In the project folder run: `npx auth secret` (it writes AUTH_SECRET to `.env.local`). Later paste the same value into Netlify env vars.

### PROMPT 2A — install and configure Auth.js on Neon

```
We are replacing Supabase Auth with Auth.js (NextAuth v5) backed by our Neon Postgres database. Keep the app runnable at every step.

Context files to read first: lib/auth/session.ts, lib/data/mode.ts, middleware.ts, lib/supabase/*, app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx, components/auth/auth-form.tsx, lib/social/db.ts.

Do this:
1. Install next-auth@beta.
2. Add a Neon migration db/migrations/0002_auth.sql creating: users (id, email unique, password_hash, full_name, created_at), workspaces (id, name, owner_id, plan default 'none', created_at), and workspace_members (workspace_id, user_id, role). Use the same TEXT id style as social_posts.
3. Add auth.ts at the project root configuring Auth.js with a Credentials provider (email + password, hashed with bcryptjs) that reads/writes the Neon users table. Add AUTH_SECRET to .env.example.
Show me the plan first, then implement, then tell me how to test.
```

**Test:** app still builds; the new SQL runs cleanly in Neon.

### PROMPT 2B — make the app use Auth.js sessions

```
Now switch the app's session layer to Auth.js.

1. Rewrite lib/auth/session.ts so getCurrentUser() and getCurrentWorkspaceId() read from the Auth.js session instead of Supabase. On first login, auto-create a workspace + owner membership in Neon and return its id.
2. Update middleware.ts to protect /dashboard and /admin using Auth.js.
3. Point app/(auth)/login and app/(auth)/signup (and components/auth/auth-form.tsx) at Auth.js sign-in / sign-up (create the user with a hashed password on signup).
4. Leave the other Supabase-backed data modules in mock mode (USE_SUPABASE stays false) so nothing else breaks yet.

Show the plan, implement, then give me exact steps to test signing up two accounts and confirming they see separate, empty data.
```

**Test:** you can sign up, log in, land on `/dashboard`, and Content Studio/Calendar save per-account.

### PROMPT 2C — deploy the login update

```
Summarize the new environment variables I need to add in Netlify (AUTH_SECRET, and confirm DATABASE_URL and NEXT_PUBLIC_APP_URL). Give me the exact Netlify steps and anything to run in Neon. Then confirm the production build passes with `npm run build`.
```

**YOU DO THIS:** add `AUTH_SECRET` in Netlify env vars, redeploy, test signup on the live URL.

---

## MILESTONE 3 — Real AI + publishing (still free to start)

### PROMPT 3A — real AI captions (free Gemini or Groq)

```
Read lib/social/generate.ts. Replace the local template generator inside generatePosts() with a real call to a FREE LLM, keeping the exact same GeneratedPost[] return shape and the local generator as an automatic fallback when no key is set.

Use Google Gemini (gemini-1.5-flash) via GEMINI_API_KEY, or Groq via GROQ_API_KEY — whichever key is present. Build a prompt from businessName, industry, platform, pillar and topic that returns 3 on-brand caption variations with hashtags. Add the key(s) to .env.example. Tell me how to test with and without a key.
```

**YOU DO THIS:** get a free key from Google AI Studio (aistudio.google.com) or Groq (console.groq.com), add it to `.env.local` and Netlify.

### PROMPT 3B — actually publish to Instagram & TikTok

```
We want to publish/schedule the posts saved in lib/social/store.ts to Instagram and TikTok using a unified social API (Ayrshare or bundle.social) so we don't build each platform integration by hand. Read lib/social/store.ts, lib/social/actions.ts, and the Content Calendar page.

Propose the smallest design: connect-accounts screen, storing the API key/profile per workspace, a "publish now" action, and a scheduled job that publishes posts whose scheduled_for has passed and flips status to 'published'. Show the plan and cost/free-tier notes BEFORE writing code.
```

**YOU DO THIS:** create a free/trial account with the chosen API when prompted.

---

## Environment variables — full list

| Variable | Milestone | Where |
|----------|-----------|-------|
| `DATABASE_URL` | 1 | Netlify env (+ optional `.env.local`) |
| `NEXT_PUBLIC_APP_URL` | 1 | Netlify env |
| `AUTH_SECRET` | 2 | `.env.local` + Netlify env |
| `GEMINI_API_KEY` or `GROQ_API_KEY` | 3 | `.env.local` + Netlify env |
| Ayrshare/bundle.social key | 3 | Netlify env |

Never commit these — `.gitignore` already excludes `.env*`.

---

## Quick recap of the order
1. Accounts (GitHub, Neon, Netlify) → **Prompt 1** → deploy → live URL. 
2. **Prompts 2A → 2B → 2C** → real login on the live site. 
3. **Prompt 3A** (free AI), then **Prompt 3B** (publishing) when you're ready.
