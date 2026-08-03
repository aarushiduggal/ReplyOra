# ReplyOra Social — Go Live on Netlify + Neon (free, public, never expires)

Goal: put ReplyOra online so **anyone can access it**, on a database that **never pauses**, for **$0**. No Vercel, no Supabase.

**The stack:**
- **Your existing Next.js app** — no rewrite.
- **Neon** — free Postgres database that auto-wakes instantly (fixes the "expires after 7 days" problem; that was Supabase pausing).
- **Netlify** — free, public, always-on hosting.

**What it costs:** nothing to start. You only pay if you get real traffic and outgrow the free tiers — a good problem to have.

> Keep every key secret. Never paste keys into chat, and never commit them to GitHub. They go into Netlify's environment settings only.

---

## The big picture (3 milestones)

1. **Milestone 1 — Get it online with a real database (this guide).** The site is live and publicly reachable; the Content Studio + Content Calendar save to Neon.
2. **Milestone 2 — Swap the login system.** Right now login uses Supabase. Because we're leaving Supabase, we move authentication to **Auth.js** (free). Until then, the live site runs in single-workspace mode. *(I'll do this with you next — it's code, not accounts.)*
3. **Milestone 3 — Real publishing + AI.** Connect Instagram/TikTok publishing (via a unified API) and drop in a free Gemini/Groq key for real AI captions.

This guide covers **Milestone 1**.

---

## Part 1 — Create the free accounts (you do this)

| # | Account | What it's for | Free? |
|---|---------|---------------|-------|
| 1 | **GitHub** (github.com) | Stores your code; Netlify deploys from it | Free |
| 2 | **Neon** (neon.tech) | The database that never pauses | Free tier |
| 3 | **Netlify** (netlify.com) | Hosts the live website | Free tier |

Tip: sign into all three with the **same email** to keep it simple.

---

## Part 2 — Set up the Neon database

1. In Neon, click **New Project** → name it `replyora` → pick the region closest to you → **Create**.
2. On the project dashboard, find **Connection string** and copy it. It looks like:
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
   **This is your `DATABASE_URL`.** Keep it private.
3. Open the **SQL Editor** (left sidebar).
4. Open the file `db/migrations/0001_social_posts.sql` from your project, copy everything in it, paste it into Neon's SQL editor, and click **Run**. You should see "Success." (This creates the table that stores your posts.)

That's the database done — it's live and it won't pause.

---

## Part 3 — Put your code on GitHub

If your code isn't on GitHub yet, from the `replyora-starter` folder:

```bash
git init
git add .
git commit -m "ReplyOra Social"
```

Then create an empty repo on GitHub called `replyora` and follow its "push an existing repository" instructions (it gives you two commands to paste).

> Your `.gitignore` already excludes `.env*` files, so your secrets won't be uploaded. Good.

---

## Part 4 — Deploy on Netlify

1. In Netlify: **Add new site → Import an existing project → GitHub →** pick your `replyora` repo.
2. Netlify auto-detects Next.js. Leave the build command (`next build`) and publish settings as detected.
3. Before deploying, open **Site settings → Environment variables → Add a variable:**
   - Key: `DATABASE_URL`
   - Value: the Neon connection string from Part 2.
   - (Add `NEXT_PUBLIC_APP_URL` = your Netlify URL once you know it, e.g. `https://replyora.netlify.app`.)
4. Click **Deploy**. In ~2 minutes you'll get a public URL like `https://replyora.netlify.app` — that's your live site, reachable by anyone, and it won't expire.

Every time you push to GitHub, Netlify redeploys automatically.

---

## Part 5 — Custom domain (optional, later)

- A free `something.netlify.app` subdomain works forever.
- If you want `replyora.com`, buy it (~$10–15/yr — the only non-free thing, and optional) and add it under **Netlify → Domain settings**. Netlify gives you free HTTPS.

---

## Part 6 — Local development stays free & instant

On your own machine you don't need Neon at all. If `DATABASE_URL` is **not** set, the app automatically uses a free in-memory store, so `npm run dev` just works with zero setup. Set `DATABASE_URL` locally only if you want your local app to read/write the real Neon database.

```bash
# .env.local  (never commit this)
DATABASE_URL=postgresql://...your neon string...
```

---

## Environment variables — the whole list (Milestone 1)

| Variable | Where | Needed |
|----------|-------|--------|
| `DATABASE_URL` | Netlify env + optionally `.env.local` | Yes — the Neon connection string |
| `NEXT_PUBLIC_APP_URL` | Netlify env | Recommended — your live URL |

That's all Milestone 1 needs. (Auth keys come in Milestone 2; AI/publishing keys in Milestone 3.)

---

## What to tell me next

Say the word and we do **Milestone 2 (swap login to Auth.js)** so real users can sign up on the live site — that's the piece that turns this from "online" into "a real product people can use." It's all code on my side; you won't need new paid accounts.
