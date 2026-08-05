import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { FaqAccordion } from "@/components/marketing/social/faq-accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ · Replyora",
  description:
    "Questions, answered — how Replyora works, which platforms we support, pricing, the free trial, approvals, agencies and cancellation.",
};

export default function FaqPage() {
  return (
    <>
      <FaqAccordion />

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="overflow-hidden rounded-[2rem] bg-oxblood px-8 py-20 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl sm:text-5xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              Start a free trial and see it for yourself, or book a demo and
              we&apos;ll walk you through everything.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-cream text-oxblood hover:bg-cream/90">
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
