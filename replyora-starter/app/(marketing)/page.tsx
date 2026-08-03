import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Code2,
  Globe,
  MessageSquareText,
  Sparkles,
  Star,
  UserPlus,
  Zap,
} from "lucide-react";

import { Pricing } from "@/components/marketing/pricing";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { WhileYouSleep } from "@/components/marketing/while-you-sleep";
import { Reveal, CountUp } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  { icon: Zap, title: "Replies instantly, 24/7", body: "Answers from your own content the moment a visitor asks — no missed enquiries at 9pm on a Sunday." },
  { icon: UserPlus, title: "Captures every lead", body: "Structured name/email/phone capture and intent qualification are built in, not bolted on." },
  { icon: CalendarCheck, title: "Books customers", body: "Every conversation is steered toward a booking — outcome is revenue, not just deflection." },
  { icon: Sparkles, title: "Speaks in your brand voice", body: "Tone, colours, welcome message and persona are core config — it sounds like you, not a robot." },
];

const STEPS = [
  { icon: BookOpen, title: "Train it on your business", body: "Paste your FAQs, services and pricing, or upload a PDF. Replyora learns your business in minutes." },
  { icon: MessageSquareText, title: "Customise & preview", body: "Set the persona, brand colour and the details you want to collect. Test it live in the dashboard." },
  { icon: CalendarCheck, title: "Drop in one line of code", body: "Paste the embed snippet on your site. Watch conversations and leads land in your inbox." },
];

const TESTIMONIALS = [
  { quote: "It captured eleven leads in our first weekend — bookings we'd have lost to voicemail.", name: "Amara Nguyen", role: "Coastal Glow Skin Clinic, Manly" },
  { quote: "Our front desk stopped drowning in website enquiries. Replyora answers and books while we treat clients.", name: "Dr. Sam Whitfield", role: "Northside Physio" },
  { quote: "Setup took 20 minutes. The after-hours enquiries alone paid for it in week one.", name: "Bianca Rossi", role: "Rossi Hair Studio" },
];

const INTEGRATIONS = [
  { label: "Any website", icon: Globe },
  { label: "One line of code", icon: Code2 },
  { label: "Google Calendar", icon: CalendarClock },
  { label: "Calendly", icon: CalendarCheck },
];

export default function LandingPage() {
  return (
    <>
      <HeroDemo />

      {/* Integrations strip */}
      <section className="border-y border-border/60 bg-oat/40">
        <Reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-8">
          <span className="text-xs font-medium uppercase tracking-widest text-ink/60">
            Installs on your website · books into your calendar
          </span>
          {INTEGRATIONS.map((i) => (
            <span key={i.label} className="flex items-center gap-2 text-ink/70">
              <i.icon className="h-4 w-4 text-rose" aria-hidden="true" />
              <span className="text-sm font-medium">{i.label}</span>
            </span>
          ))}
        </Reveal>
      </section>

      {/* Value props */}
      <section id="features" className="scroll-mt-20 bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl text-oxblood">
              More than a chatbot. A lead engine.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most chatbot builders optimise for deflection. Replyora optimises
              for revenue.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((vp, i) => (
              <Reveal key={vp.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                    <vp.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{vp.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{vp.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 bg-oat/40">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-rose">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl text-oxblood">
              Live in minutes, not weeks
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood font-display text-lg text-cream">
                    {i + 1}
                  </span>
                  <step.icon className="h-5 w-5 text-rose" />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* While you sleep — night section */}
      <WhileYouSleep />

      {/* Social proof */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-rose/40 bg-oat px-3 py-1 text-xs font-medium uppercase tracking-widest text-wine">
              Illustrative examples
            </span>
            <h2 className="mt-3 font-display text-4xl text-oxblood">
              What a great outcome looks like
            </h2>
            <p className="mt-3 text-sm text-ink/70">
              We&apos;re in an early pilot program — the quotes and figures below
              are illustrative scenarios, not real customer results.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex gap-0.5 text-rose" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-ink/80">
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

          {/* Illustrative scenario */}
          <Reveal className="mt-10 overflow-hidden rounded-3xl border border-border bg-oat/50">
            <div className="grid gap-6 p-8 sm:grid-cols-3 sm:items-center">
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-rose">
                  Illustrative scenario
                </p>
                <h3 className="mt-2 font-display text-2xl text-oxblood">
                  What booking more after-hours consults could look like
                </h3>
                <p className="mt-2 text-sm text-ink/70">
                  An example of the outcome we&apos;re building toward: after-hours
                  enquiries qualified and booked automatically instead of going
                  cold. Figures are illustrative.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/blog">Read the playbook</Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center sm:block sm:space-y-4">
                <StatBlock label="consults (example)">
                  <CountUp to={32} prefix="+" suffix="%" />
                </StatBlock>
                <StatBlock label="leads / wknd (example)">
                  <CountUp to={11} />
                </StatBlock>
                <StatBlock label="avg reply">
                  <CountUp to={4} suffix="s" />
                </StatBlock>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="border-t border-border/60 bg-oat/40">
        <Pricing />
      </div>

      {/* CTA */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="overflow-hidden rounded-3xl bg-oxblood px-8 py-16 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl">
              Stop losing enquiries after hours.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              Stand up a trained, on-brand assistant today and let it capture
              leads while you get back to your customers.
            </p>
            <Button asChild size="lg" className="mt-8 bg-cream text-oxblood hover:bg-cream/90">
              <Link href="/signup">
                Start 7-day trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-cream/80">
              No card to start · cancel anytime · 30-day setup-fee guarantee
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function StatBlock({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="font-display text-3xl text-oxblood">{children}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
