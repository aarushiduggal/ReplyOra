# ReplyOra — Full Product Audit

**Date:** 9 August 2026 · **Auditor:** live walkthrough of replyora.net (marketing, agency dashboard as Owner, client portal, staff/admin as Superadmin)

---

## Executive summary

The product is in far better shape than most pre-launch SaaS — the marketing site, agency dashboard, client portal and staff portal are all built and, on direct load, **functional**. It looks and feels like a real, polished product.

Three things matter most before Friday:

1. **The whole product promises automatic publishing — but you told me it's plan-only, and the legal docs I just wrote say you don't post on anyone's behalf.** This contradiction runs through the marketing site, the app copy, and the integrations screen. It also affects Meta app review. This is the #1 thing to resolve.
2. **Intermittent navigation errors (503 / error page)** when moving between pages inside the app. Every page works on a fresh load, but clicking around can throw an error until you reload. Reliability risk.
3. **Test/junk data everywhere** (test posts, a weird chatbox entry, example.com accounts, demo audit-log rows). Clean it before real prospects see it.

Nothing is fundamentally broken. It's polish, consistency, and one strategic decision.

---

## 1. Marketing website (replyora.net)

Polished, on-brand, animated. Pages present and loading: Home, Product, Pricing, FAQ, Blog, Privacy, Terms, Login, custom 404.

**Working well**
- Privacy & Terms are **live with the exact correct content** — Aarushi Duggal sole trader, ABN 14 143 824 703, Australian Consumer Law clause, 9 July 2026 dates. ✓
- Pricing matches the agreed plan exactly: Personal $49 / Studio $79 / Agency $249 AUD, "Most popular" on Studio, 7-day trial (card required, auto-converts), $39/site chatbox add-on, annual = 2 months free. Compare table complete. ✓
- Booking calendar embedded on the home "Book a call" section (Sydney/Melbourne timezone). ✓
- Blog has 5 real dated posts by Aarushi.

**Fix**
- **[HIGH · strategic] Auto-publish overclaim.** Home: "Approve and it posts to Instagram & TikTok on time", "Schedule & publish", "from idea to posted". FAQ: "set it to publish automatically", "Once approved, it publishes on schedule". This conflicts with plan-only and with the legal docs. Decide the truth, then make every page say the same thing.
- **[MEDIUM] Facebook inconsistency.** Pricing and FAQ list "Instagram, Facebook & TikTok", but the homepage and product page say only "Instagram & TikTok". Add Facebook to the homepage/product copy.
- **[LOW] Product page** has a stray mock artifact ("New we") under AI captions.
- **[LOW] Verify blog "Read more"** posts open real detail pages (not tested in depth).

---

## 2. Agency dashboard (logged in as Owner)

Overall: **excellent and functional.** Nav: Clients, To-Do, Assets, Invoices, Settings.

**Clients overview** — stat cards (Scheduled / In review / Published / Outstanding), client list (Bloom Hair Studio, Replyora), recent activity, 2/8 active.
- **[MEDIUM] Data inconsistency:** "Published" stat shows **0**, but Recent Activity lists several "Published a post" events.
- **[MEDIUM] Reliability:** prefetch of client pages returns **503** (soft-navigation can error; direct load works).

**Per-client workspace (10 tabs — all load on direct navigation):**
- **Overview** — setup checklist (3/7 done), stats, quick actions. ✓
- **Grid** — IG/Facebook toggle, live Instagram feed preview, **Grid Intelligence** (feed harmony %, extracted palette, recommended post times), asset tray, drafts/scheduled. Impressive. ✓
- **Calendar** — Planner / Month / Spreadsheet / Approval Queue views, Share-month toggle. ✓
- **Studio** — AI batch generator (Brief → Generate → Review → Save to grid); platforms include **Facebook**; pillars, formats, 1–12 posts. ✓ (generation not run)
- **Assets** — upload (JPG/PNG/MP4 ≤200MB), folders, splits "your uploads" vs "client uploads". ✓
- **Chatbox** — Train / Configure / Install, knowledge base (FAQ/text/URL/PDF). ✓ — **[MEDIUM] junk KB entry:** "I'm so sorry to hear about your brother… speak with Caitlyn." Delete.
- **Approvals** — read-only client portal link (no login), Send-for-review. ✓ — **[MEDIUM] 7 test posts** (TEST / test / untitled). Delete.
- **Reports** — live Instagram analytics (reach 12.2K, engagement, saves), date range, Save as PDF, auto-written "what changed" narrative, sub-tabs. ✓ — **[LOW] metric glitch:** "3 posts this period · +7 vs previous" (contradictory); published count rendered 2 then 3.
- **Invoices (per-client)** — AUD, tax rate 0% (correct — you're not GST-registered), new invoice, bill-to. ✓
- **Integrations** — Instagram connected, Facebook connected, TikTok "connect". ✓ — copy: "scheduled posts publish automatically" (see auto-publish issue).

**Global nav**
- **To-Do (/tasks)** — task board (open / in progress / completed). ✓
- **Assets (/assets)** — global library. ✓
- **Settings (/settings)** — Profile / Preferences / Integrations / Billing / Workspace / Data:
  - **Billing** — plan Agency (trial, A$249/mo), monthly/yearly, switch plan, chatbox add-on $39. Matches pricing. ✓
  - **Workspace** — white-label business details (name, logo URL, report title, address, country=Australia). **[LOW] business email/phone/address are empty** → client portals, invoices and reports will show blank agency contact. Fill these.
  - **Data** — Export workspace data (JSON) + Request account deletion ("within 30 days") + contact hello.replyora@gmail.com. **Matches the privacy policy.** ✓
- **[MEDIUM · bug] Settings can throw an error page via in-app navigation** (RSC), but loads fine on direct load — same soft-navigation issue as the client pages.

---

## 3. Client portal (/portal/[id]) — read-only, no login

- Works. "Hi [Client] 👋 — approve what you love or request changes." Planned grid + "for your review" sections with clean empty states ("Nothing shared yet", "No posts waiting on you"). Matches your "simple link, no login" promise. ✓
- Couldn't exercise approve/request-changes (nothing has been sent for review yet).
- **[LOW] "Powered by Replyora°" always shows** — consider a white-label toggle for the Agency tier.
- **[LOW] Agency name/logo not shown** (Workspace details empty) — fill Workspace so the portal is branded to the agency, not blank.

---

## 4. Staff / admin portal (/admin) — Superadmin

Fully built and genuinely sophisticated. Banner: "Internal staff area — every view and edit is audited."

- **Command Center** — KPIs (agencies, MRR, brands, posts, signups, trials), Needs-attention queue, revenue-by-plan, all-agencies table with **"Enter as" impersonation** + Open. ✓
- **Accounts** — every account + newsletter opt-in, copy-emails for newsletter. ✓
- **Revenue** — MRR / ARR / ARPA / paying / **trial pipeline $475** / at-risk, "where MRR comes from", plan mix, agencies-by-revenue. ✓
- **Staff & audit** — platform admins (superadmin/staff), add staff, filterable audit log. ✓ — **[LOW] demo data:** audit log references agencies "Coastal Glow Skin Clinic" / "Northside Physio" (not real workspaces), seed staffer "Jordan Lee", and @replyora.com admin emails vs your actual gmail accounts.
- **Broadcast** — segmented announcements (all / agency / personal / trials), sent history. ✓

---

## Cleanup checklist (before Friday)

- Delete test agencies: **Bondi Bakes** (verify-…@example.com), **Test Biz** (authtest-…@example.com). Consolidate the 3 founder accounts (hello.replyora, saritaduggal59, aarushiduggal8) into one.
- Remove the junk **chatbox knowledge entry** ("sorry about your brother").
- Delete the **7 test posts** (TEST / test / untitled) in the Replyora client.
- Clear demo **audit-log / staff seed** (Jordan Lee, Coastal Glow, Northside Physio) if not real.
- Fill **Workspace** business details so portals/invoices/reports aren't blank.

---

## Priority fix list

**P0 — before launch**
1. **Reconcile publishing.** Either wire real auto-publishing (needs Meta content-publish permission + review) OR change every "publishes automatically" line across the site and app to match plan-only (e.g. "plan & schedule — publish in a tap" / reminders). Then re-check the privacy/terms wording accordingly.
2. **Fix the RSC / soft-navigation 503 errors** (client pages and Settings). Every page works on direct load but in-app clicks can error until reload — this will read as "buggy" to a trial user. Likely a Netlify + Next App Router dynamic-route/SSR issue.
3. **Clean the test/junk data** (above).

**P1**
4. Add **Facebook** to homepage + product platform copy (pricing/FAQ already have it).
5. Fix **"Published" stat vs recent activity**, and the Reports "+7 vs 3" metric glitch.
6. Fill **Workspace** business details.

**P2**
7. **White-label toggle** ("Powered by Replyora") for Agency tier.
8. Verify blog detail pages; remove the product-page "New we" mock artifact.

---

## What's genuinely strong

Grid Intelligence (feed harmony, palette, best times), live Instagram reporting, the AI Studio batch flow, the no-login client approval portal, per-client invoicing in AUD with correct 0% GST, and a real multi-tenant staff console with audited impersonation. This is a lot of working product for a pre-launch — the work now is consistency and trust, not building from scratch.
