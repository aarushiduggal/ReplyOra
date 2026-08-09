import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { ProductShowcase } from "@/components/marketing/social/product-showcase";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Product · Replyora",
  description:
    "Replyora is two systems in one login — a content engine that plans, writes and schedules your Instagram, Facebook & TikTok, and a website chatbox that answers, captures leads and books 24/7. Try both live.",
};

export default function ProductPage() {
  return (
    <>
      {/* Hero — distinct from the homepage: short, centered, statement-led */}
      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center sm:py-16">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              The product
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-[1.04] text-wine sm:text-6xl">
              One login runs your{" "}
              <span className="italic text-oxblood">feed</span> and your{" "}
              <span className="italic text-oxblood">front desk.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
              Replyora is two systems in one workspace — a content engine that
              plans, writes and schedules your socials, and a website chatbox
              that answers, captures and books around the clock. Try them both
              below.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-oxblood/30"
              >
                <Link href="/demo">Book a demo</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Interactive centrepiece — auto-plays between the two systems */}
      <ProductShowcase />

      {/* Compact CTA */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <Reveal className="overflow-hidden rounded-[2rem] bg-oxblood px-8 py-14 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-xl font-display text-3xl sm:text-4xl">
              Two systems. One free trial.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-cream text-oxblood hover:bg-cream/90"
              >
                <Link href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              >
                <Link href="/demo">Book a demo</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
