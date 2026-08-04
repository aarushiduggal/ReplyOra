import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Instagram,
  LayoutGrid,
  Music2,
  Palette,
  PenLine,
  Sparkles,
} from "lucide-react";

import { PlaygroundHero } from "@/components/marketing/social/playground-hero";
import { SocialPricing } from "@/components/marketing/social/social-pricing";
import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

const PILLARS = [
  { icon: PenLine, title: "Content, written for you", body: "Posts, captions and hooks in your voice — generated from your business, never a generic template." },
  { icon: CalendarClock, title: "Planned & scheduled", body: "A full content calendar for Instagram & TikTok. A month of posts, ready and queued — never scramble again." },
  { icon: Palette, title: "On-brand, always", body: "Your colours, your tone, your style on every post — so the feed looks like you, not a bot." },
  { icon: LayoutGrid, title: "All in one place", body: "Plan, create, and approve everything from one simple dashboard. Two taps and your week is done." },
];

const STEPS = [
  { n: 1, title: "Tell us your business", body: "Your services, your vibe, your voice. We learn it in minutes — no brief, no back-and-forth." },
  { n: 2, title: "We create & schedule", body: "On-brand posts for Instagram & TikTok, planned across the whole month and ready to go." },
  { n: 3, title: "You approve — it posts", body: "Glance, tweak if you like, tap approve. It goes out on time, every time, while you work." },
];

const PROOF = [
  { quote: "I stopped dreading content. It just shows up on brand every week and I approve it in two minutes.", name: "Bianca Rossi", role: "Rossi Hair Studio" },
  { quote: "A whole month of posts, planned and ready to go. I finally got my Sundays back.", name: "Amara Nguyen", role: "Coastal Glow Skin Clinic" },
  { quote: "It sounds like us, not a template. That's the thing that actually sold me.", name: "Sam Whitfield", role: "Northside Physio" },
];

export default function LandingPage() {
  return (
    <>
      <PlaygroundHero />

      {/* Platforms strip */}
      <section className="border-y border-oxblood/10 bg-white">
        <Reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-7">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            We create & schedule for
          </span>
          <span className="flex items-center gap-2 text-ink/70">
            <Instagram className="h-4 w-4 text-rose" /> <span className="text-sm font-medium">Instagram</span>
          </span>
          <span className="flex items-center gap-2 text-ink/70">
            <Music2 className="h-4 w-4 text-rose" /> <span className="text-sm font-medium">TikTok</span>
          </span>
          <span className="text-xs italic text-ink/40">more platforms coming soon</span>
        </Reveal>
      </section>

      {/* The loop — dark band for contrast */}
      <section id="features" className="scroll-mt-20 bg-oxblood">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blush">
              Done-for-you social media
            </p>
            <h2 className="mt-3 font-display text-4xl text-cream sm:text-5xl">
              Everything your feed needs, handled.
            </h2>
            <p className="mt-4 text-cream/70">
              Not just a scheduler — the whole job. Content created, planned, and
              posted so you never have to think about it.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-cream/15 bg-cream/5 p-6 transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream/15 text-cream">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-cream">{p.title}</h3>
                  <p className="mt-2 text-sm text-cream/70">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
              You run the business. We run the feed.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-oxblood font-display text-lg text-cream">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl text-wine">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="border-t border-oxblood/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-rose/40 bg-cream px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-wine">
              Illustrative examples
            </span>
            <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
              What it looks like when it&apos;s handled
            </h2>
            <p className="mt-3 text-sm text-ink/60">
              We&apos;re in an early pilot — the quotes below are illustrative
              scenarios, not real customer results yet.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROOF.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-oxblood/10 bg-cream p-6">
                  <Sparkles className="h-5 w-5 text-rose" aria-hidden="true" />
                  <blockquote className="mt-4 flex-1 font-display text-lg italic leading-snug text-wine">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-medium text-ink">{t.name}</span>
                    <span className="block text-ink/60">{t.role} · illustrative</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Pricing
            </p>
            <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
              Simple plans. Free to try.
            </h2>
            <p className="mt-3 text-sm text-ink/60">
              One brand or a whole client roster — start with a free trial.
            </p>
          </Reveal>
          <div className="mt-12">
            <SocialPricing />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="overflow-hidden rounded-[2rem] bg-oxblood px-8 py-16 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl sm:text-5xl">
              Your socials, sorted.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              We&apos;ll create your content, plan it, and post it — so you can get
              back to running your business.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-cream text-oxblood hover:bg-cream/90">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-cream/70">Free trial · no card to start</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
