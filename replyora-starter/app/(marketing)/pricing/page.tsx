import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/marketing/motion";
import { SocialPricing } from "@/components/marketing/social/social-pricing";

export const metadata: Metadata = {
  title: "Pricing · Replyora",
  description:
    "Three simple plans for Replyora — Personal, Studio and Agency. Start with a 7-day free trial.",
};

export default function PricingPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
              Pricing
            </p>
            <h1 className="mt-3 font-display text-5xl text-oxblood sm:text-6xl">
              Simple plans that grow with you.
            </h1>
            <p className="mt-4 text-ink/70">
              Personal for one brand, Studio for a few, Agency for a full roster.
              Every plan starts with a 7-day free trial. Prices in AUD.
            </p>
          </Reveal>

          <div className="mt-12">
            <SocialPricing />
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
