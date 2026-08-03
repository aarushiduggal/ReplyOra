# ReplyOra — Claude Code handoff (get it live tonight)

Paste these into Claude Code **in order**, run the test after each, then deploy. Everything below already compiles (`npx tsc --noEmit` is clean); these prompts finish the wiring + polish.

Current state: homepage rebuilt (social-first, light/white, dark oxblood band), Content Studio + Content Calendar live, Neon data layer ready, Auth.js migration in progress, new `/brands` picker page added.

---

### PROMPT 1 — finish Auth.js login and send users to the brand picker

```
Finish the Auth.js migration. When a user signs up or logs in, redirect them to /brands (the brand picker at app/brands/page.tsx), not straight to /dashboard. Read auth.ts, lib/auth/session.ts, lib/data/mode.ts, middleware.ts, app/(auth)/login and signup. Make sure middleware protects /brands and /dashboard. On first login, auto-create the user's workspace in Neon. Tell me exactly how to test signing up a fresh account end to end.
```

Test: sign up a new account → land on `/brands` → click the brand → `/dashboard`.

### PROMPT 2 — make the brand picker real (multi-brand)

```
Make app/brands/page.tsx list ALL brands the signed-in user owns from Neon (not just one), and make "New brand" at /onboarding actually create a brand/workspace row and set it active. Read app/brands/page.tsx, lib/data/workspace.ts, and the Neon schema in db/migrations. Keep the existing light editorial styling. Tell me how to test creating a second brand.
```

Test: create a second brand → both show on `/brands` → each opens its own empty dashboard.

### PROMPT 3 — restyle the dashboard to match the new site

```
Restyle the dashboard shell to match the new marketing site: light/white background, Playfair (font-display) headings in oxblood/wine, Montserrat body, rose accents, generous whitespace, thin oxblood/10 borders, rounded-2xl cards — inspired by Entire Socials' calm editorial look. Read components/dashboard/sidebar.tsx, topbar.tsx, page-header.tsx, stat-card.tsx and app/(dashboard)/layout.tsx. Add a small brand switcher in the topbar that links back to /brands. Keep it feeling live and engaging. Don't change any data logic. Show me before/after and how to test.
```

Test: `/dashboard/studio` and `/dashboard/planner` look consistent with the homepage.

### PROMPT 4 — ship it

```
Run `npm run build` and fix anything that fails. Then give me the exact git commands to commit and push, and confirm the Netlify env vars I need (DATABASE_URL, NEXT_PUBLIC_APP_URL, AUTH_SECRET). After I push, tell me how to verify the live site at replyora.netlify.app.
```

Test: `npm run build` passes → push → Netlify redeploys → live site shows the new homepage, working signup → `/brands` → dashboard.

---

## If you're short on time tonight — minimum to be "live"
1. Prompt 1 (login → /brands) and Prompt 4 (build + deploy). That gets a real, styled, working site online with signup.
2. Prompts 2 and 3 (multi-brand + dashboard restyle) can follow tomorrow — they're polish, not blockers.

## Env vars (Netlify → Site settings → Environment variables)
`DATABASE_URL` (Neon) · `NEXT_PUBLIC_APP_URL` (your Netlify URL) · `AUTH_SECRET` (from `npx auth secret`).
