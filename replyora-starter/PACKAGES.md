# Replyora — Packages (source of truth)

**Delivery:** Replyora ships **today** as a **website-embed AI assistant only** (a chat widget on the customer's website). It does **not** run on Instagram / WhatsApp / Messenger / SMS — never claim social or omnichannel as available. **Voice/phone answering is on the public roadmap as a "coming soon" Pro feature** (see `/roadmap` + waitlist): market it only as coming-soon, never as currently live or bundled.

**Model:** This is a **done-for-you service** as much as software. The core thing customers pay more for is how **fresh and well-managed** we keep their assistant (update/retrain cadence). "Number of assistants" is **not** a differentiator — don't use it.

**Billing:** No free plan. **7-day free trial**, then pay. **One-time $250 setup fee** (done-for-you setup & training) on the first invoice of every plan. Prices AUD/month.

---

## Starter — "Set it up right" · $250/mo + $250 setup
For a simple, single-site business whose info rarely changes.
- Knowledge base: **Basic FAQs only (up to ~10 pages)**
- Instant replies + **lead capture & qualification**
- Email alert on every new lead
- Self-serve edits in the dashboard are free anytime
- **1 done-for-you update / retrain per quarter included** (reactive); extra done-for-you changes are **$25 each**
- "Powered by Replyora" badge shown
- *Best for:* a single salon, a solo trader, a simple service business.

## Growth — "Kept fresh" ⭐ Most Popular · $300/mo + $250 setup
Everything in Starter, plus the tools that turn enquiries into booked jobs and keep the assistant current.
- Bigger knowledge base — up to ~100 pages (services, pricing, policies, documents — not just FAQs)
- **Booking / calendar + time-slot booking** — assistant offers times from opening hours or a connected Google Calendar / Calendly, books the appointment, marks the lead **"Booked,"** notifies the owner
- **Human handoff** — owner can jump into a live chat
- **Remove "Powered by Replyora"** (white-label widget)
- **Abandoned-enquiry recovery** — if a visitor starts a chat or booking and drops off, the assistant emails them to finish
- **Proactive 90-day refresh** — we review + retrain the assistant every 90 days (we reach out)
- **90-day performance review call**
- *Best for:* booking-driven businesses that change through the year — physio/allied health, salons, gyms, dental.

## Pro — "Fully managed" · $390/mo + $250 setup
Everything in Growth, plus a fully-managed, self-improving assistant and the revenue-growth engines.
- Largest knowledge base — up to ~500 pages (effectively unlimited for a single business)
- **Update anytime, priority turnaround**
- **Continuous AI retraining** — the assistant learns from real conversations, flags questions it couldn't answer, and keeps improving (self-improving)
- **Review & reputation engine** — after a booking or a happy chat, the assistant automatically asks the customer for a Google review → more 5-star reviews
- **No-show reduction** — automatic appointment reminders + confirmations before bookings, plus easy rebooking of cancellations, so customers actually turn up
- **AI lead win-back** — automatically follows up leads that didn't book ("still interested?") on a schedule, recovering lost enquiries
- **Performance review call every 2 months**
- *Best for:* high-value, reputation-sensitive or multi-location businesses — tradies (plumbing/HVAC/electrical/roofing), med spas & skin clinics, law firms, busy clinics.

---

**Knowledge base is measured in "pages" (owner-friendly), not MB:** Starter ~10 pages · Growth ~100 pages · Pro ~500 pages. (~1 page ≈ 500 words; enforce internally by characters/tokens.)

**AI (all plans get real AI):** Every plan answers with real Claude from its own knowledge base — AI is never removed. Starter just has a smaller (FAQs-only) knowledge base. Model is the premium lever: **Starter & Growth → Claude Haiku** (fast, cost-efficient); **Pro → Claude Sonnet** (smarter model for tougher questions). **Continuous retraining is Pro-only** (the self-improving loop that teaches the assistant from questions it couldn't answer) — separate from raw answer quality.

**Numeric caps:**
- Messages / month: Starter **1,000** · Growth **5,000** · Pro **20,000**
- Team seats: Starter **2** · Growth **3** · Pro **5**
- Trial (7 days, `plan=none`): **Growth-level features** (lead capture, booking, human handoff, abandoned recovery, remove-branding), capped at **150 messages**; NO Pro-only features; then must pick a paid plan.

## Add-ons (optional)
- Extra done-for-you update on Starter — **$25 each**
- Extra message credits — $X / 1,000 (TBD)

---

## Feature flags to gate (in `lib/stripe/plans.ts`) + build order
Gate each premium feature by plan flag; enforce numeric limits in `lib/usage.ts`.

| Feature / flag | Starter | Growth | Pro |
|---|---|---|---|
| `leadCapture` | ✓ | ✓ | ✓ |
| `booking` | — | ✓ | ✓ |
| `humanHandoff` | — | ✓ | ✓ |
| `removeBranding` | — | ✓ | ✓ |
| `abandonedRecovery` | — | ✓ | ✓ |
| `continuousRetrain` | — | — | ✓ |
| `reviewEngine` | — | — | ✓ |
| `noShowReduction` | — | — | ✓ |
| `leadWinBack` | — | — | ✓ |
| Update cadence (service) | 1/quarter reactive | 90-day proactive | anytime |
| Performance call (service) | — | every 90 days | every 60 days |

**Build order:** enforce limits/flags → booking → human handoff → remove-branding → abandoned-enquiry recovery (Growth) → review engine → no-show reduction → AI lead win-back → continuous retraining (Pro). The "update cadence" and "performance calls" are **service commitments you deliver**, tracked in the dashboard (e.g. a reminder + log), not automated product features.
