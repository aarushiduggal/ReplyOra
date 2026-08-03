# Entire Socials — Product Teardown & ReplyOra Social Brief

*Researched live inside a logged-in Personal trial (entiresocials.com), 3 Aug 2026. Prepared for the ReplyOra pivot: make the social-media-management portal the main product, with the AI reply/booking widget as a secondary feature.*

---

## 1. What Entire Socials actually is

A **social media management platform built for the people who manage social media** — solo social media managers (SMMs) and small agencies. Founded in New York by **Tania Assi** (product/engineering) and **Charel Gijzen** (creative direction). The public marketing site is deliberately minimal ("quiet luxury" — black on white, monospaced labels, huge whitespace); the entire product sits behind login.

Its wedge is **not feature breadth**. It's craft and workflow: a beautiful, opinionated tool for planning a client's feed, getting the client to approve it, and reporting results back. Think "Later/Planoly's visual planner + a client-approval and agency-admin layer," not "Hootsuite/Sprout's everything-firehose."

**Positioning line they use:** *"The social media management platform — manage your entire socials."*

---

## 2. Pricing & packaging (confirmed in-app)

| Tier | Price | Who it's for | Core limits |
|------|-------|--------------|-------------|
| **Personal** | **$49/mo** | A single operator / one brand | One account; the full planning toolkit |
| **Social Media Managers (Agency)** | **$249/mo** or **$2,499/yr** (save $489/yr) | SMMs with a client roster | **Up to 5 client workspaces**, multiple social accounts per client |
| Beyond 5 clients | Custom (email) | Larger agencies | Contact sales |

Billing runs through **Stripe** (self-serve manage/cancel). The Agency tier adds, on top of "everything in Personal for every client": client invoicing with branded PDF exports, performance reports with period comparison + PDF export, a revenue hub with per-client billing settings, cross-client task tracking, team & client portal invites, a workspace-wide shared asset library, per-client brand kits/pillars/feature controls, and agency notes with scoped client access.

**Read on the pricing:** $49 solo is competitive with Later/Planoly. $249 for only 5 clients is *premium* — they're betting the craft + client-facing polish justifies it. That's a soft spot: an agency managing 15 clients pays a lot, and the 5-client ceiling is low.

---

## 3. Information architecture (how the app is organised)

Two levels of navigation.

**Top-level (workspace):** `Clients` · `To-Do` · `Assets` · `Invoices` · `Settings` · `Logout`
- **Clients** — the roster; each client is a workspace you drill into.
- **To-Do** — cross-client task tracking for the agency.
- **Assets** — workspace-wide shared media library.
- **Invoices** — client billing with branded PDF exports.
- **Settings** — Profile · Preferences · Integrations · Billing · Data.

**Per-client:** `Overview` · `Grid` · `Calendar` · `Assets` · `Reports` · `Invoices` · `Integrations`

Everything hangs off **the client**. This is the whole philosophy: you don't manage "posts," you manage *clients*, and each client has a plan, a feed, a calendar, assets, and a report.

---

## 4. Feature-by-feature teardown

### 4.1 Client Overview (`(01)`)
The per-client home. Shows a **setup checklist (0/7)**, **Package Deliverables** (what you've promised the client each month), **Platforms Managed**, **Pillars** (content pillars/themes), an **Upcoming Feed — Instagram** grid preview, and three headline counters: **Posts Planned / In Approval Queue / Approved**. Plus a **To-Do** list and **Private Notes (agency only)**. This is the account-management cockpit — deliverables and status at a glance.

### 4.2 Grid — the signature feature (`(02)`)
A **visual Instagram feed planner**. Two modes: **Grid** and **Studio**.
- An **iPhone profile mock** (username, bio, follower/following counts, the 3-wide grid, reels/tagged tabs) so you can see exactly how the feed will look.
- **Asset library** on the right: upload assets, drag unplaced assets into the grid, **Undo/Redo**, filter/arrange.
- **Drafts**, **+ Carousel**, and **Scheduled** columns.
- Toggles for **Reels** (pull live posts from IG) and **Scheduled dates**.
- **Edit Profile Preview** to fake the bio/photo/follower counts for the mock.
- Its own **Approval Queue**.

This is the aesthetic heart of the product and the reason SMMs would pay: curating the grid *look* before anything goes live.

### 4.3 Calendar (`(03)`)
Four views: **Planner · Month · Spreadsheet · Approval Queue**. Month-grid with prev/next/Today. Crucially it has a **client-sharing model**: a **"Share month"** toggle and a **"Hidden from [client]"** state — *"Add concepts, planned posts, or marketing plans — they share with the client automatically."* So the calendar is simultaneously the agency's planning surface and the client's window into what's coming.

### 4.4 Assets
Per-client media library plus a **workspace-wide shared asset library** (Agency tier). Central place for the raw photos/videos/graphics that get placed into the grid and calendar.

### 4.5 Reports
**Instagram performance analytics** framed explicitly as a **"client-call dashboard"**: period comparison, **top posts with previews**, **pillar breakdown**, and an **editable executive summary** you can refine before presenting. **PDF export.** Data for the last 365 days. This is a *retention/justify-your-retainer* feature — it exists to make the monthly client call easy.

### 4.6 Invoices
Client invoicing with **branded PDF exports**, plus a **revenue hub** and per-client billing settings on the Agency tier. They've folded the agency's *own* billing admin into the product — a genuine stickiness play.

### 4.7 Integrations — the key limitation
Per client you can **Connect Instagram** and **Connect TikTok** — *and only those two.* The description: *"Published posts appear as read-only reference tiles on this client's Grid."* 

This is the single most important finding. The integration is thin and IG/TikTok-only, and the language leans toward **pulling published posts back in for the grid mock** rather than a robust multi-network auto-publisher. Whether scheduled posts truly auto-publish via API or act as reminders is not clearly surfaced. Either way: **no LinkedIn, Facebook, X, YouTube, Pinterest, Threads, Bluesky, Google Business** — and no AI. That is the opening.

### 4.8 Settings
Profile (name, phone, email, password) · Preferences · Integrations · **Billing** (Stripe) · Data. Standard, clean, minimal.

---

## 5. The core workflow (why SMMs would love it)

1. Add a **client**, set their **package deliverables**, **pillars**, and **brand kit**.
2. Upload **assets**.
3. **Curate the Grid** — drag assets into the feed until the aesthetic is right; build drafts and carousels.
4. **Plan the Calendar** — schedule concepts across the month.
5. **Share** the month / push posts to the **Approval Queue**; the client reviews and approves in their portal.
6. Post goes live (IG/TikTok); it flows back as a **reference tile** on the grid.
7. End of month: generate the **Report** (with editable exec summary, PDF) for the client call.
8. Send the **Invoice**.

It's a full **agency operating system** wrapped around one aesthetic idea (the grid) and one relationship idea (client approval + reporting). That coherence is its strength.

---

## 6. Design & UX language (reference for our redesign)

- **Monochrome**: near-black text on white, faint hairline rules, occasional warm off-white (cream) panel fills.
- **Typography-led**: a clean grotesque sans; **uppercase, letter-spaced micro-labels** (`( PLATFORM )`, `PLATFORMS MANAGED · 0`); large light-weight section headers.
- **Numbered sections** (`( 01 ) OVERVIEW`, `( 02 ) GRID`) — an editorial, "system" feel.
- **Enormous whitespace**, content sits in a narrow left column with lots of air.
- **Device mockups** (the iPhone IG profile) as the visual centrepiece.
- Overall: **quiet-luxury / editorial / boutique**. It signals "premium tool for tasteful people," which is a deliberate contrast to the busy dashboards of Hootsuite/Sprout.

For ReplyOra, this is worth partially emulating (the calm, editorial confidence) while keeping our warmer brand palette (oxblood/oat/cream we already use).

---

## 7. Strengths vs. weaknesses

**Strengths**
- Beautiful, focused, opinionated — the grid planner + client-approval loop is genuinely well-executed.
- Agency admin (invoicing, revenue hub, reports, tasks) baked in → high switching cost.
- Client-facing polish (share month, approval queue, branded reports) → makes SMMs look good to *their* clients.

**Weaknesses / gaps (our openings)**
1. **No AI.** Nothing generates captions, ideas, or content. In 2026 that's a glaring hole.
2. **Only Instagram + TikTok.** No LinkedIn/FB/X/YouTube/Pinterest/Threads/Bluesky/Google Business.
3. **Thin/ambiguous publishing.** Emphasis is planning + reference, not confident multi-network auto-publishing.
4. **5-client ceiling at $249/mo** — expensive for scaling agencies; nothing between $49 and $249.
5. **Inbound is absent.** It plans *outbound* content but does nothing with the DMs, comments, and website enquiries that content generates. **That's exactly where ReplyOra already lives.**

---

## 8. The ReplyOra angle — the story Entire Socials can't tell

ReplyOra already owns the **inbound** side: the assistant that answers website enquiries, captures leads, and books customers, plus the **Win-Back Agent** that reactivates lapsed customers. Entire Socials owns the **outbound planning** side but stops at publishing and has no AI and no inbound.

**Fused, ReplyOra becomes the only tool that does the full loop:**

> **Create the content → publish it → answer everyone it brings in → book them.**

Positioning: **"ReplyOra runs your social — and replies to everyone it brings in."** Content and conversation in one place. That is a category of one; Entire Socials (outbound-only, no AI) and Chatbase-style bots (inbound-only) each own half.

**What makes our social portal different, concretely:**
- **AI content studio**: generate on-brand posts, captions, and pillars **from the business's existing knowledge base and brand voice** — which ReplyOra already stores. Entire Socials makes you write everything yourself.
- **Real multi-network publishing** (see §9) beyond IG/TikTok.
- **Closed loop to revenue**: a post's comments/DMs and the resulting website enquiries land in the same ReplyOra inbox that already captures and books leads. No competitor connects "the post" to "the booking."

---

## 9. Build approach (do NOT rebuild what they built the hard way)

The expensive, painful part of *any* social tool is the **platform integrations** — each network's OAuth, token refresh, rate limits, media rules, and lengthy app-review/permission process. Entire Socials only did two (IG + TikTok), probably because it's brutal. **We should not hand-build 8 integrations.**

Two viable paths:

- **A — Unified publishing API (recommended to start).** Use **Ayrshare** or **bundle.social**: one API that publishes + pulls analytics across IG, TikTok, LinkedIn, Facebook, X, YouTube, Pinterest, Threads, Bluesky, Google Business. Multi-tenant, built for embedding in a SaaS. Lets us ship the *differentiated* layer (AI studio + grid + inbound loop) in weeks instead of fighting OAuth for months. Trade-off: per-profile cost.
- **B — Self-host open source.** **Postiz** (AGPL, ~20–33 networks, ships an API + AI + Canva-like editor) or **Mixpost** (self-hosted, one-time license, approval workflows). Cheaper at scale, more control; more ops burden.

**Recommendation:** launch on **Ayrshare/bundle.social** for speed and breadth, keep **Postiz** as the self-host fallback once volume justifies owning it. Reuse ReplyOra's existing stack (Next.js, Supabase, Stripe, Claude API) — the social portal is new modules in the same app, exactly like the Win-Back Agent, not a separate product.

---

## 10. Recommended MVP scope for "ReplyOra Social"

Phase it so we get to something demoable fast, then layer the moat.

**Phase 1 — Planner + AI studio (our wedge).**
Client/brand workspaces · content pillars & brand kit (reuse the KB/brand voice we store) · **AI post generator** (captions + ideas from the KB) · a **visual grid planner** (match/exceed their signature feature) · calendar with month view · drafts/carousels.

**Phase 2 — Publish for real.**
Wire Ayrshare/bundle.social · connect IG, TikTok, **LinkedIn, Facebook, Google Business** first (highest value for our SMB/service niche) · scheduling + auto-publish · approval queue (owner or client signs off).

**Phase 3 — Close the loop (the thing no one else has).**
Route post comments/DMs + the website enquiries a campaign drives into the existing ReplyOra reply/lead inbox · tie "content published" → "leads captured" → "bookings" in one analytics view · monthly client report (beat their PDF with our booking/revenue numbers).

**Phase 4 — Agency mode.**
Multi-client roster · client portal invites · branded invoicing/reports · cross-client tasks — but priced better than their 5-client/$249 ceiling.

---

## 11. Website & hosting notes (the other thing you raised)

You said the current Vercel starter *"keeps expiring after 7 days of no use."* That symptom isn't how Vercel **production** deployments behave (those persist) — it sounds like you're viewing a **preview/temporary deployment** or a paused project, not a promoted production site on a custom domain. Two clean options:

- **Keep Next.js, fix the deploy:** promote to a **production** deployment on a **custom domain** (e.g. replyora.com) — it won't "expire," and we keep the app/dashboard/widget we've already built. Simplest and cheapest.
- **If the goal is easy visual editing of the marketing site:** move only the *marketing pages* to **Framer** or **Webflow** (no-code, never expires, easy to redesign), and keep the **app/portal** on Next.js. Best of both.

Given the pivot (portal-first, chat secondary), we'll want to **redesign both the marketing site and the portal** around the social product. I'd keep the portal in Next.js (it's an app, not a brochure) and redesign it in the calmer, editorial direction — our warm palette, their whitespace discipline.

---

## 12. Immediate next steps

1. Decide MVP scope — I recommend **Phase 1 (Planner + AI studio)** first; it's our differentiation and demos beautifully.
2. Pick the publishing path — **Ayrshare/bundle.social** to start (I can spike a proof-of-concept).
3. Sort hosting — promote to production on a custom domain, or split marketing → Framer/Webflow. Tell me which "expiring" thing you're seeing and I'll fix it.
4. Redesign direction — portal-first IA (Content · Calendar · Grid · Publish · Inbox · Reports · Clients), editorial visual language.

---

## 13. Instagram & the business behind the product (origin, GTM, brand)

Researching their social makes one thing clear: **Entire Socials is an agency that built its own software and then sold the software.** That single fact explains the entire shape of the product.

### 13.1 The origin — a boutique creative agency
`entiresocials.nl` is the original **Amsterdam creative agency** (Charel Gijzen), still live and taking bookings. Its services: **Social Media Management, Instagram grid curation, shoot production, creative direction, brand launches, TikTok content creation, copywriting, and social-media training** — "serving clients worldwide." Named clients skew fashion/beauty/lifestyle: **Daily Paper** (a well-known Amsterdam streetwear label), **Xelly Beauty**, **Corecet** (NYC), **Stellar Whispers** (Amsterdam), **Choojiie** (London), and an **Annika Yanura** collab (Berlin).

Then they built `entiresocials.com` — the platform — with **Tania Assi (@taniangelina)** leading product/engineering and **Charel (@charelgijzen)** leading brand/creative, to run their *own* agency, and productized it for other social media managers.

**Why this matters:** every "odd" choice in the product is now obvious.
- **Client-centric IA** → because they think in client rosters, not posts.
- **Grid curation as the hero feature** → it's literally their agency's signature service.
- **Fashion/luxury aesthetic** → that's their client base and their taste.
- **Instagram + TikTok only** → that's all their fashion/beauty clients care about.
- **Approval + reporting loop** → it mirrors how a real retainer relationship runs.

The product is **narrow because it's dogfooded on one kind of client.** Its depth in that lane is its strength; its narrowness everywhere else is our opening.

### 13.2 Instagram presence (@entiresocials)
- **122 posts · ~3,045 followers · 769 following** · category "Social media agency."
- **Bio is a straight product pitch:** *"The Social Media Management platform. Manage your entire socials. Founded by @charelgijzen & @taniangelina."*
- **Highlights:** "Seen On" (press/social proof) and "Platform" (product).
- **Content mix:** quiet-luxury lifestyle shots (marble, espresso, fine dining, editorial fashion) + **product-demo reels** ("Ready to manage your entire socials in one place?", "How we onboard every new client on Entire Socials", "AI is turning your content into 5 different tools"). Aesthetic-first, aspirational.
- **Distribution is founder-led:** Charel actively posts about the workflow on **Threads and TikTok** (@charelgijzen), pulling their SMM audience toward the platform.

### 13.3 What their social reveals (and the implications for us)
1. **They're early-stage and beatable.** ~3k followers, a 5-client ceiling, two networks, no AI. This is not an entrenched incumbent — it's a tasteful, well-executed seedling.
2. **Their moat is taste + a niche (fashion/beauty).** Don't try to out-pretty them. **ReplyOra's niche is service SMBs** — physio, salon, gym, medical, NDIS — a larger, less aesthetic-obsessed market that measures success in **bookings and revenue, not grid beauty.** We win by being **results-first and AI-native**, not prettier.
3. **Copy the playbook, not the product.** Their GTM is "dogfood → productize → market it with founder-led content." Aarushi already has the raw material — prospect lists, carousels, a brand kit, and ReplyOra itself. **Run ReplyOra's own socials *with* ReplyOra Social**, and use founder-led content (Aarushi's voice) as distribution, exactly like Charel does.
4. **Instagram *is* their acquisition channel** — which validates a build-in flywheel: every post scheduled through ReplyOra can subtly carry ReplyOra, turning customers into distribution.

**One-line takeaway:** Entire Socials is a beautifully-executed *agency-in-a-box for fashion SMMs*. It has no AI, no inbound, and only two networks. ReplyOra can enter one lane over — **service SMBs** — and be the tool that **creates the content, publishes it everywhere, and books everyone it brings in.** They can't follow us there without abandoning the taste-and-niche position that is their whole brand.

---

### Sources
- Entire Socials — homepage, About, and logged-in app (Overview, Grid, Calendar, Integrations, Reports, Settings/Billing), entiresocials.com, accessed 3 Aug 2026.
- Entire Socials — Instagram (@entiresocials, 122 posts / ~3,045 followers) and the original agency site entiresocials.nl (clients, services), accessed 3 Aug 2026.
- Founders — Charel Gijzen (@charelgijzen) and Tania Assi (@taniangelina).
- Postiz (open-source scheduler) — github.com/gitroomhq/postiz-app; postiz.com.
- Mixpost (self-hosted) — mixpost.app.
- Ayrshare (unified social API) — ayrshare.com; bundle.social.
