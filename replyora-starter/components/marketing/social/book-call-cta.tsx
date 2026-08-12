import Link from "next/link";
import { ArrowRight, CalendarCheck, Mail } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Final homepage CTA — instead of a plain button band, this lets a visitor
 * actually book a meeting inline via Calendly (with a graceful email fallback
 * until NEXT_PUBLIC_CALENDLY_URL is set).
 */

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/hello-replyora/30min";

const BENEFITS = [
  "A 20-minute walkthrough tailored to your business",
  "See the feed planner, calendar and AI captions live",
  "Leave with a content plan for your first week",
];

export function BookCallCta() {
  return (
    <section className="bg-oxblood">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blush">
            Book a call
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
            Give your feed the team it deserves.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/80">
            Grab a time and we&apos;ll walk you through your feed and your website
            chatbox — tailored to your business. Prefer to dive in? Start your
            7-day free trial — a card&apos;s required and it auto-converts after
            the trial.
          </p>

          <ul className="mt-7 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-cream/85">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-blush" />
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-cream text-oxblood hover:bg-cream/90"
            >
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-cream/75 hover:text-cream"
            >
              or email us
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {CALENDLY_URL ? (
            <CalendlyEmbed url={CALENDLY_URL} />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-oxblood/10 bg-cream p-8 text-center text-ink">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood text-cream">
                <Mail className="h-6 w-6" />
              </span>
              <h3 className="font-display text-xl text-oxblood">Book by email</h3>
              <p className="max-w-xs text-sm text-ink/70">
                Our live calendar drops in here — for now, send a note and
                we&apos;ll find a time that suits you.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm font-medium text-oxblood hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
