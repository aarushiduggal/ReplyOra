# ReplyOra — Full Dashboard Build Spec

A complete, in-depth spec to make ReplyOra's dashboard do what Entire Socials' does. This lives **outside the repo on purpose** so it doesn't collide with your live Claude Code edits. Work through it in Claude Code, module by module, in the build order in §6.

> ⚠️ Only ONE agent should edit the repo at a time. While Claude Code is building from this spec, I won't write to the repo.

---

## 0. Fix the current build error first

In `components/social/grid-planner.tsx`, the `tintFor` helper returns `TINTS[h % TINTS.length]`, which is `string | undefined` under `noUncheckedIndexedAccess`. One-line fix:

```
return TINTS[h % TINTS.length] ?? "#5C1A1A";
```

Run `npx tsc --noEmit` — it should be clean after this.

---

## 1. Pricing (final)

Prices in AUD. 7-day free trial on both. Yearly = 2 months free.

| Plan | Monthly | Yearly | Trial | Who |
|------|---------|--------|-------|-----|
| **Personal** | **$50/mo** | **$500/yr** (save $100) | 7 days | One business / one brand |
| **Agency** | **$200/mo** | **$2,000/yr** (save $400) | 7 days | Managing client brands (up to 10; custom beyond) |

Marketing pricing component (`components/marketing/social/social-pricing.tsx`) should use these numbers with a Monthly/Yearly toggle. Stripe: create 4 prices (personal-monthly, personal-yearly, agency-monthly, agency-yearly), all with a 7-day trial on checkout.

**Personal includes:** 1 brand · Instagram & TikTok · AI captions · Grid planner · content calendar · unlimited scheduling · brand kit.
**Agency adds:** up to 10 client brands · client portal & approvals · client invoicing (branded PDFs) · performance reports · priority support.

---

## 2. Product architecture (agency-first, mirrors Entire Socials)

**Two nav levels.**

Top-level (the agency/workspace): `Clients` · `To-Do` · `Assets` · `Invoices` · `Settings`
Per-client (each brand you manage): `Overview` · `Grid` · `Calendar` · `Studio` · `Assets` · `Approvals` · `Reports` · `Invoices` · `Integrations`

Everything hangs off a **client (brand)**. Personal-plan users simply have exactly one client (their own brand) and the agency-only surfaces (Clients roster, client Invoices) are hidden or simplified.

Routes:
- `/clients` (roster) · `/clients/[id]` (Overview) · `/clients/[id]/grid` · `/calendar` · `/assets` · `/approvals` · `/reports` · `/invoices` · `/integrations`
- Top-level: `/tasks` (To-Do) · `/assets` (all) · `/invoices` (all) · `/settings`

(Adapt to your existing `/dashboard/*` structure — the key is the client-scoped grouping.)

---

## 3. Data model (Neon — new migrations)

`social_posts` already exists. Add a `client_id` to it and create these tables. Keep the `TEXT` id style.

```
clients            id, workspace_id, name, handle, avatar_url,
                   platforms (text[]), package_deliverables (text),
                   private_notes (text), created_at
pillars            id, client_id, name, colour
profile_preview    client_id (pk), username, display_name, followers,
                   following, bio, website
social_posts       + client_id (fk), + order_index (int)  ← add columns
assets             id, workspace_id, client_id, url, kind ('image'|'video'),
                   folder, uploaded_by ('agency'|'client'), created_at
approvals          post_id (pk), status ('pending'|'approved'|'changes'),
                   client_note, decided_at
invoices           id, workspace_id, client_id, number, issued_at, due_at,
                   status ('draft'|'sent'|'paid'|'overdue'), currency,
                   line_items (jsonb), bill_to (jsonb), total_cents
tasks              id, workspace_id, client_id (nullable), title,
                   status ('todo'|'in_progress'|'done'), due_at, sort_index
workspace_billing  workspace_id (pk), business_name, logo_url, address (jsonb),
                   report_title, tax_rate, terms, currency
```

Everything is workspace-scoped; add indexes on `(workspace_id)` and `(client_id)`.

---

## 4. Module specs

Each module below has **Purpose · UI · Data · Prompt**. Paste the prompt into Claude Code.

### 4.1 Clients roster + agency onboarding
Purpose: the first screen after login — list client brands, add new, plus a "Welcome" guide that points to Settings → Workspace for agency setup.
UI: header "( 01 ) CLIENTS · N active · + Add client", grid of client cards (avatar, name, quick stats), a first-run 2-step welcome modal.
Data: `clients`, `workspace_billing`.
```
Build the Clients roster at /clients (reuse app/brands/page.tsx styling). List all clients for the signed-in workspace from Neon, with an "+ Add client" that creates a client row and opens its Overview. Add a first-run "Welcome" modal (2 steps) that links to Settings → Workspace. Light editorial style (oxblood/oat, Playfair headings). Tell me how to test adding a client.
```

### 4.2 Client Overview
Purpose: the brand's cockpit.
UI: brand name, setup checklist (x/7), Package Deliverables, Platforms managed, Pillars, an "Upcoming feed · Instagram" 3×3 preview, and three counters — Posts planned / In approval / Approved — plus To-Do and Private notes (agency only).
Data: `clients`, `pillars`, `social_posts`, `approvals`, `tasks`.
```
Build the client Overview at /clients/[id]. Show the setup checklist, package deliverables, platforms, pillars, an upcoming-feed 3x3 preview from scheduled posts, and Posts planned / In approval / Approved counts computed from social_posts + approvals for this client. Add To-Do and agency-only Private notes. Match the editorial style. Tell me how to test.
```

### 4.3 Grid (finish + enhance)
Purpose: visual IG feed planner (the signature). You already have `components/social/grid-planner.tsx`.
Add: Edit-profile modal (username/display name/followers/following/bio/website → drives the mock), Upload assets + Upload-from-phone (QR) entry points, Reels/Tagged tabs on the mock, persistent tile order (`order_index`), and an Approval-queue link.
Data: `profile_preview`, `assets`, `social_posts.order_index`, `approvals`.
```
Enhance components/social/grid-planner.tsx: add an Edit-profile modal that saves to profile_preview and updates the iPhone mock; add "Upload assets" and "Upload from phone" (QR) entry points wired to the Assets library; persist tile drag-order to social_posts.order_index via a server action; add an Approval-queue link. Keep it typechecking. Tell me how to test.
```

### 4.4 Calendar
Purpose: the content schedule. You have `/dashboard/planner`.
Add the four views from Entire Socials: **Planner · Month · Spreadsheet · Approval Queue**, a "Share month" toggle (client visibility), and click-a-day-to-create.
Data: `social_posts`, `approvals`.
```
Expand the Content Calendar into four views — Planner, Month, Spreadsheet, Approval Queue — with a "Share month" toggle. Month view: click a day to create a post (media, caption, pillar, time). Spreadsheet: list of the month's posts with inline edits. Approval Queue: send posts for client sign-off. All read/write social_posts in Neon. Tell me how to test.
```

### 4.5 Studio (batch content + AI)
Purpose: batch a shoot-dump into posts; the AI caption studio you already have at `/dashboard/studio`.
Add: name a batch, pick/upload assets, arrange into carousels/posts/reels, create drafts that land on Grid + Calendar.
```
Extend Content Studio into a batch tool: name a batch, select assets from the library, arrange into posts/carousels/reels, generate captions (existing generator), and save drafts that appear on the Grid and Calendar. Tell me how to test.
```

### 4.6 Assets
Purpose: media library per client.
UI: folders (Library, + new folder), drag-drop upload (JPG/PNG/MP4), "Your uploads" vs "Client uploads" split, select mode.
Data: `assets`. Storage: use a free tier (Cloudflare R2 / Supabase Storage-free / UploadThing free) — pick one and wire it.
```
Build the Assets library at /clients/[id]/assets: folders, drag-drop upload of images/videos to <storage>, "Your uploads" vs "Client uploads" split, and a select mode so assets can be placed on the Grid. Create the assets table migration. Recommend the cheapest free storage and wire it. Tell me how to test an upload.
```

### 4.7 Approvals + client portal
Purpose: client sign-off before publishing.
UI: a queue of posts pending review; per post Approve / Request changes with a note. A read-only client portal link.
Data: `approvals`.
```
Build Approvals at /clients/[id]/approvals: list posts with status pending, let the agency send for review and the client Approve or Request changes (with a note). Add a shareable read-only client portal view of the queue + planned grid. Tell me how to test both sides.
```

### 4.8 Reports
Purpose: client-call analytics.
UI: date range, period comparison, top posts with previews, pillar breakdown, editable executive summary, PDF export. Requires a connected IG account (gate with an "Instagram not connected" empty state).
```
Build Reports at /clients/[id]/reports: date range, period comparison, top posts, pillar breakdown, editable executive summary, PDF export. Show an "Instagram not connected" state until Integrations are wired. Tell me how to test with mock data.
```

### 4.9 Invoices (agency)
Purpose: bill clients.
UI: Billed / Paid / Outstanding / Past-due stats, invoice list, + New invoice, Bill-to details, tax/terms/currency (inherits agency defaults).
Data: `invoices`, `workspace_billing`.
```
Build client Invoices at /clients/[id]/invoices: summary stats (billed/paid/outstanding/past due), invoice list, + New invoice (line items, due date), Bill-to panel, and defaults inherited from workspace_billing. Branded PDF export. Tell me how to test.
```

### 4.10 Integrations
Purpose: connect IG/TikTok per client.
```
Build Integrations at /clients/[id]/integrations: Connect Instagram and Connect TikTok (OAuth stubs for now, storing tokens per client). Note IG is a paid-plan feature. Tell me how to test the connect flow stub.
```

### 4.11 To-Do (workspace)
```
Build To-Do at /tasks: To do / In progress / Completed columns, add task, drag between columns, sort by due date, scoped to the workspace (optionally tagged to a client). Persist to the tasks table. Tell me how to test.
```

### 4.12 Settings (+ agency billing)
```
Expand Settings with tabs Profile · Preferences · Integrations · Billing · Workspace. Workspace = agency name, logo, address, report title. Billing = plan (Personal/Agency, monthly/yearly), Stripe management, and client-billing defaults (tax, terms, currency) saved to workspace_billing. Tell me how to test.
```

---

## 5. Restyle the shell

```
Restyle the dashboard shell (sidebar, topbar, page-header, cards) to match the new marketing site: white background, Playfair (font-display) headings in oxblood/wine, Montserrat body, rose accents, thin oxblood/10 borders, rounded-2xl cards, generous whitespace. Add a brand switcher in the topbar linking to /clients. Don't change data logic.
```

---

## 6. Build order (and tonight's minimum)

**Tonight — make it real & live:** 0 (fix build) → 4.1 Clients → 4.2 Overview → 4.3 Grid finish → deploy. That gives a working, agency-shaped dashboard.

**Then, in order:** 4.4 Calendar → 4.6 Assets → 4.7 Approvals → 4.12 Settings/billing → 4.9 Invoices → 4.11 To-Do → 4.5 Studio batch → 4.8 Reports → 4.10 Integrations → 5 Restyle.

**Needs paid/integration work (last):** real IG/TikTok publishing + Reports analytics (needs Meta/TikTok API + review), real asset storage (free tier fine to start).

---

## 7. Env vars (cumulative)
`DATABASE_URL` (Neon) · `NEXT_PUBLIC_APP_URL` · `AUTH_SECRET` · Stripe keys + 4 price IDs · storage keys (Assets) · Meta/TikTok keys (Integrations, later) · `GEMINI_API_KEY`/`GROQ_API_KEY` (AI captions).
