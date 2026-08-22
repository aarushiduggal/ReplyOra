import Link from "next/link";
import { ArrowRight, Clock, MessageCircle, Sparkles, UserPlus } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

/**
 * The AI Website Chatbox feature — Replyora's niche differentiator. A standout,
 * dark oxblood band that sells "your website, answered 24/7" and previews the
 * exact chatbox that's live in the corner of this very site. The `id="chatbox"`
 * anchor is linked from the footer and the product page.
 */

const POINTS: { icon: typeof MessageCircle; title: string; body: string }[] = [
  {
    icon: MessageCircle,
    title: "Answers your FAQs",
    body: "Hours, pricing, services, location — answered instantly in your brand voice, trained on your business.",
  },
  {
    icon: UserPlus,
    title: "Captures every lead",
    body: "It gently collects a name and best contact so no late-night enquiry ever slips through the cracks.",
  },
  {
    icon: Clock,
    title: "Books enquiries 24/7",
    body: "Points ready-to-buy visitors to book or enquire while you sleep — your website finally sells for you.",
  },
];

const CHAT_PREVIEW: { role: "user" | "assistant"; text: string }[] = [
  { role: "assistant", text: "Hi! Welcome to Rosewood 🌹 How can I help today?" },
  { role: "user", text: "Do you have anything free this Saturday?" },
  {
    role: "assistant",
    text: "We do — a couple of afternoon spots left. Want me to grab your name and pop you in?",
  },
];

export function ChatboxFeature() {
  return (
    <section id="chatbox" className="scroll-mt-20 bg-wine">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blush">
            <Sparkles className="h-3.5 w-3.5" /> Website chatbox
          </p>
          <h2 className="mt-5 font-display text-4xl leading-tight text-cream sm:text-5xl">
            Your website, answered 24/7.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/80">
            Add a warm AI chatbox to your site in minutes. Trained on your
            business, it answers questions, captures leads and books enquiries
            around the clock — even at 2am when you&apos;re fast asleep. It&apos;s
            the same assistant sitting in the corner of this page right now.
          </p>

          <div className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream/12 text-cream">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg text-cream">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-cream/70">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-cream text-oxblood hover:bg-cream/90"
            >
              <Link href="/waitlist">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-cream/70">Try it now — bottom-right corner ↘</p>
          </div>
        </Reveal>

        {/* Chat preview card */}
        <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-3xl border border-cream/15 bg-cream shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 bg-oxblood px-4 py-3 text-cream">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="font-display text-sm">Rosewood assistant</p>
                <p className="text-[11px] text-cream/70">Online · replies instantly</p>
              </div>
            </div>
            <div className="space-y-3 bg-cream px-4 py-5">
              {CHAT_PREVIEW.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-oxblood text-cream"
                        : "rounded-bl-sm border border-oxblood/10 bg-white text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-oxblood/10 bg-white px-3.5 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
