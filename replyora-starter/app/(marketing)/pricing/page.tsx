import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/marketing/motion";
import { PricingBuilder } from "@/components/marketing/social/pricing-builder";

export const metadata: Metadata = {
  title: "Pricing · Replyora",
  description:
    "Simple plans for Replyora — one brand or a whole client roster. Start with a free trial, no card required.",
};

export default function PricingPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Pricing
            </p>
            <h1 className="mt-3 font-display text-5xl text-oxblood sm:text-6xl">
              Only pay for what you need.
            </h1>
            <p className="mt-4 text-ink/70">
              Start at $50 for one brand and add what you need — the website
              chatbox, a whole client roster, branded reports. Free to try, no
              card.
            </p>
          </Reveal>

          <div className="mt-12">
            <PricingBuilder />
          </div>

          <Reveal className="mt-12 text-center text-sm text-ink/60">
            Got a question first?{" "}
            <Link href="/faq" className="font-medium text-oxblood hover:underline">
              Read the FAQ
            </Link>{" "}
            or{" "}
            <Link href="/demo" className="font-medium text-oxblood hover:underline">
              book a call
            </Link>
            .
          </Reveal>
        </div>
      </section>
    </>
  );
}
