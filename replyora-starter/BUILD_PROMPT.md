# Replyora — master build prompt (paste into Claude Code)

> Read `CLAUDE.md` first. We're extending the existing mock prototype. **Constraints for this whole job:**
> - Keep everything runnable with no external accounts — **no real Supabase, Stripe, or AI keys yet.** Build all new features on the existing **mock/stub data layer** (`lib/data/`), and behind each integration leave a clear `// TODO: replace with real <service>` seam so I can wire the real thing later.
> - Stay on the Replyora brand (oxblood/oat/cream, Playfair + Montserrat, Fredoka "replyora°" wordmark with the open dot).
> - Work in the ordered phases below. **Before each phase, show me a short plan + file list, build it, then tell me what changed and how to test it.** Don't do everything in one shot.
> - TypeScript strict, no `any`. Keep it polished, not placeholder. Keep `npm run dev` working after every phase.
>
> ---
> ## Phase A — Bugs, polish & logo
> 1. **Fix the dashboard sidebar footer / logo bug:** the "View marketing site" link at the bottom-left is cut off and overlapping the user-avatar circle. Lay it out cleanly (proper spacing, no overlap, readable on all screen heights).
> 2. **Logo/wordmark correctness everywhere:** make the "replyora°" wordmark a single reusable component (Fredoka, lowercase, with the open-dot "°"). Use it consistently in the top-left, sidebar, footer and widget; ensure correct sizing/contrast on both light (oat) and dark (oxblood) backgrounds. No clipped or overlapping marks.
> 3. **"Booked" honesty:** the dashboard "Booked" stat and any "book a consult" copy imply a booking feature that doesn't exist yet — keep the copy but make it real once Phase B lands (until then, point it at the new booking flow, not a dead end).
> 4. **Seed data tidy:** "Hannah Smith" still has email `hannah.w@icloud.com` — fix. Sweep the seed for other name/email mismatches.
> 5. **Mobile responsive:** make the dashboard + landing fully usable on phone widths (collapsible sidebar). Owners are on mobile.
> 6. **Empty states + first-run:** for a brand-new workspace with no data, show helpful empty states and a "get started" checklist instead of blank screens.
>
> ## Phase B — Tier 1: the lead-engine core (the real differentiator)
> 7. **Booking engine:** add a booking capability the assistant can drive — a native "pick a time" flow (available slots from business hours) plus an integration seam for Calendly/Google Calendar later. Bookings should create/advance a lead to "Booked" and show on the dashboard. Add a "Bookings" view.
> 8. **Website-only — no social channels.** Replyora is a website-embed widget ONLY. Do NOT build or claim Instagram/WhatsApp/Messenger/omnichannel anywhere. Remove any such wording from plans, features, and the marketing site. (Premium tier features are defined in `PACKAGES.md`: booking, human handoff, remove-branding, missed-call text-back, review engine — build those instead.)
> 9. **Real-time owner alerts:** when a lead is captured or a booking is made, trigger a notification (in-app toast + stubbed email/SMS/push via the seam). Add a notifications panel + notification settings.
> 10. **Lead qualification & scoring:** have the assistant ask qualifying questions (service, urgency, suburb/budget) and compute a hot/warm/cold score per lead; surface the score + qualification details in the Leads inbox.
>
> ## Phase C — Tier 2: competitive necessities
> 11. **Human handoff / live takeover:** let the owner jump into a live conversation; add an "assistant vs human" state on conversations.
> 12. **Follow-up automation:** auto-nudge cold/unconverted leads after a delay (configurable message + timing), modelled in the data layer.
> 13. **Conversation detail view:** full transcript page with the ability to convert to a lead, add internal notes, and see channel + page source.
> 14. **Analytics:** a real analytics page — visitor → lead → booking funnel, response time, after-hours leads captured, by channel and over time (charts).
>
> ## Phase D — Tier 3: growth & trust
> 15. **Onboarding wizard + niche templates:** a guided first-run (business profile → add knowledge → customise → install) and quick-start **templates for physio, salon, NDIS, real estate** that pre-fill knowledge/persona.
> 16. **Legal & trust:** build `/privacy`, `/terms`, and `/security` (trust) pages, rendering them from the drafts in `content/legal/privacy.md`, `content/legal/terms.md`, and `content/legal/security.md` (don't rewrite them). Use **hello.replyora@gmail.com** as the single contact email across all legal, security, trust, footer, and "Book a demo"/contact touchpoints. Replyora is **pre-launch with no registered entity/ABN yet** — keep the "pre-launch status" notes and don't invent a company name or ABN. Add workspace data export + delete in settings.
>
> ## Phase E — Marketing website additions
> 17. **Interactive "try the bot" on the homepage** (replace the static mock with a live demo using the mock KB).
> 18. **Social proof** section (testimonials, logo strip, one case study placeholder).
> 19. **Industry pages:** `/for/physio`, `/for/salons`, `/for/real-estate`, `/for/ndis` (templated, SEO-friendly).
> 20. **ROI calculator** page ("what slow replies cost you per month").
> 21. **Comparison page:** Replyora vs Chatbase / ManyChat.
> 22. **FAQ, founder/build-in-public story, Book-a-demo, a basic Blog, and a legal footer** across the marketing site.
>
> ## Phase F — Pricing change
> 24. **Use the pricing already defined in `CLAUDE.md` and `0001_init.sql` as the source of truth** and make the whole app match it (landing pricing section, pricing/billing UI, `lib/stripe/plans.ts`):
>     - **No Free plan.** New monthly prices (AUD): **Starter $250, Growth $300 (mark "Most Popular"), Pro $390**.
>     - **One-time setup fee of $250** added to the first invoice for every plan (Stripe one-time price on first checkout — stub the charge for now, not recurring).
>     - New signups get a **7-day free trial** (`plan='none'`, `plan_status='trialing'`, `trial_ends_at`), then must pay (setup fee + first month) to continue; gate the dashboard once the trial ends and `setup_fee_paid=false`.
>     - Use the final plan definitions and premium features in `PACKAGES.md` (Starter/Growth/Pro; messages, KB size, assistants, seats, branding, booking, human handoff, missed-call text-back, review engine). No "channels".
>
> ## Phase G — Top navigation (move footer links up into hover menus)
> 25. Redesign the marketing-site header into a **sticky top navigation with hover mega-menus** (desktop) / hamburger + accordion (mobile). Keep the footer as a secondary sitemap. Structure:
>     - **Product ▾** → Features · How it works · Compare (vs Chatbase) · ROI calculator · Live demo
>     - **Industries ▾** → Physiotherapy · Salons & beauty · Real estate · NDIS providers
>     - **Company ▾** → Our story (about the founder) · Blog · FAQ · Book a demo · Security & trust
>     - **Pricing** (direct link)
>     - Right side: **Log in** + **Start free trial** (primary CTA)
>     (Move the footer's "Company" links up into this Company menu; keep the footer as a secondary sitemap.)
> 26. Each dropdown item shows a short one-line description under the label (premium feel), on-brand (oat panel, oxblood text, rose accents). Header condenses slightly on scroll. Fully keyboard-accessible (focus states, aria, hover-intent delay). Ensure every nav link actually routes to its page/section — no dead links.
>
> ## Phase H — Website conversion & trust (marketing site)
> **Conversion & hero**
> 27. **Make the homepage hero chat a real, interactive assistant** (visitor can type; replies stream from the mock KB) — not a static mock with only clickable prompts.
> 28. **Dogfood: run Replyora's own live widget on replyora.com** (the actual embeddable widget, its own workspace/assistant) so the site both proves the product and captures its own leads.
> 29. **Add a risk-reducer next to every primary CTA** — e.g. "No card to start · cancel anytime" — and a satisfaction/results guarantee line, so the $250 setup fee doesn't cause drop-off.
>
> **Trust & credibility**
> 30. **Fix the fabricated testimonials and the "+32% consults" case study.** Do NOT ship invented testimonials/results as real (misleading + a legal risk under Australian Consumer Law). Either replace with real pilot quotes/results, or clearly label them "illustrative example." Same rule for any stats or customer counts.
> 31. Add an **integrations logo strip** (Google Calendar, Calendly, Zapier — website-relevant only; NO Instagram/WhatsApp/Messenger) for credibility. Only show security certs (SOC2/GDPR) or customer numbers if they are actually true.
>
> **Pricing section**
> 32. Add a **monthly / annual toggle** (annual ~20% off) to the pricing section.
> 33. Add a **one-line explainer under the "+$250 one-time setup"** ("done-for-you setup & training") so the fee reads as value, not just cost.
> 34. Add a **"compare all plans" feature matrix** below the three cards.
>
> **SEO & content**
> 35. Give each **industry page** (`/for/physio`, `/for/salons`, `/for/real-estate`, `/for/ndis`) a unique meta title/description, proper H1, target keywords, and **FAQ + LocalBusiness schema markup**.
> 36. Ensure **Blog and FAQ are real pages with content**, not just footer links. Add **OG images + meta tags** sitewide so shared links render well on social. Add sitemap.xml + robots.txt.
>
> **UX, accessibility & mobile**
> 37. **Fix low-contrast body text** (light grey on oat is below WCAG AA 4.5:1) and run an accessibility pass (focus states, alt text, aria).
> 38. **Verify mobile**: header collapses to a working hamburger; pricing cards and all sections stack cleanly.
>
> **Functionality & routing**
> 39. **"Book a demo" opens a real scheduling flow** (native or Calendly seam), not a dead button. Ensure **every nav/footer link routes to a real page/section** (no dead links).
>
> **Growth instrumentation**
> 40. Add **analytics + CTA conversion tracking** (Plausible or GA) — traffic will come from paid + social. Add an **affiliate/partner page** (referral program), since that's a proven growth channel in this category.
> 41. **About / Our story page** (`/about`, linked in the Company nav menu at the top). Render it from `content/marketing/about.md` — it's the founder story + build-in-public angle, with a founder photo, an Instagram link, and the beliefs/mission. Keep the [bracketed] placeholders for the founder's personal details until they're supplied.
> 42. **Book a demo page** (`/book-a-demo`). Render/build from `content/marketing/book-a-demo.md`: a short form (name, business, website/Instagram, email, phone, "what should your assistant handle?") that creates a lead in the mock data layer + shows a thank-you state, plus the direct email **hello.replyora@gmail.com**. Wire every "Book a demo" button/link on the site to this page.
>
> ---
> Start with Phase A. Show me the plan first.
