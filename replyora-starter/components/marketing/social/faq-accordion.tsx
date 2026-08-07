"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";

/**
 * Smooth, accessible FAQ accordion. One panel open at a time; height animates
 * via a CSS grid-rows trick (no layout jump, works with reduced motion).
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does Replyora work?",
    a: "Replyora is one workspace to plan, create and schedule your Instagram, Facebook & TikTok content. Add a brand once, then use the grid planner, content calendar and AI captions to build a whole month — and set it to publish automatically. Managing clients? Do it all per-brand, with approvals and reports built in.",
  },
  {
    q: "Who is Replyora for?",
    a: "Small businesses running their own socials, and social media managers and agencies handling a roster of clients. If you plan, create or schedule content for Instagram, Facebook & TikTok, it's built for you.",
  },
  {
    q: "Which platforms does it support?",
    a: "Instagram, Facebook and TikTok today — the ones that matter most for small businesses and agencies. More are on the way, and everything you plan is built with each platform's format in mind.",
  },
  {
    q: "How much does it cost?",
    a: "Three plans, all in AUD: Personal $49/mo (1 brand), Studio $79/mo (up to 3 brands) and Agency $249/mo (up to 8 client brands). Pay annually and you get 2 months free (Personal $490/yr, Studio $790/yr, Agency $2,490/yr). Add the AI website chatbox for $39/mo per site — and every plan starts with a 7-day free trial.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every plan starts with a 7-day free trial. A card is collected up front and the plan auto-converts when the trial ends, so there's no interruption — and you can cancel anytime before then.",
  },
  {
    q: "Will the captions actually sound like my brand?",
    a: "That's the whole point. The AI drafts captions, hooks and hashtags from your business and your tone — never a generic template — and you can tweak anything before it goes out.",
  },
  {
    q: "I'm an agency with multiple clients — can Replyora handle that?",
    a: "Yes. The Agency plan ($249/mo AUD) manages up to 8 client brands from one workspace, each with its own client portal, approvals, branded reports and invoicing. Got more than 8 clients? Get in touch and we'll unlock a higher tier for you.",
  },
  {
    q: "How do client approvals work?",
    a: "Your client gets a simple link — no login, no account needed. They open it, see the planned posts, and approve with one tap (or leave a note to request a change). Once approved, it publishes on schedule — no more email back-and-forth.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Plans are month-to-month with no lock-in — cancel whenever you need to, straight from your dashboard.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            Good to know
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-oxblood/10 border-y border-oxblood/10">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-display text-lg text-wine">{f.q}</span>
                    <Plus
                      className={`h-5 w-5 shrink-0 text-rose transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-[15px] leading-relaxed text-ink/70">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
