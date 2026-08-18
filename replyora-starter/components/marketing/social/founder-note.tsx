import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

/**
 * Warm founder note. The portrait is layered over a brand gradient via
 * background-image, so a missing file (public/marketing/founder.jpg) degrades to
 * a tasteful gradient — never a broken-image icon.
 */

export function FounderNote() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="mx-auto w-full max-w-xs">
          <div className="rounded-[2rem] bg-gradient-to-br from-oxblood via-rose to-blush p-1.5">
            <div
              role="img"
              aria-label="Aarushi, founder of Replyora"
              className="aspect-[4/5] w-full overflow-hidden rounded-[1.7rem] bg-cream"
              style={{
                backgroundImage:
                  "url(/marketing/founder.jpg), linear-gradient(150deg,#5C1A1A,#B26B62,#D9AFA6)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
            Why Replyora exists
          </p>
          <blockquote className="mt-4 font-display text-2xl leading-snug text-wine sm:text-3xl">
            &ldquo;I watched brilliant small businesses go quiet online — not for
            lack of ideas, but because content is a second full-time job. Replyora
            is the version I wished they&apos;d had: the whole feed, handled, so
            the work speaks and the owner gets their evenings back.&rdquo;
          </blockquote>
          <p className="mt-6 text-[15px] leading-relaxed text-ink/70">
            We built Replyora to feel like having a calm, on-brand social team on
            call — whether you want it fully done for you, or you&apos;d rather
            plan it yourself with better tools. Same care either way.
          </p>
          <div className="mt-6">
            <p className="font-display text-lg text-oxblood">Aarushi</p>
            <p className="text-sm text-ink/55">Founder, Replyora</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/about">
                Read our story <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-oxblood/30">
              <Link href="/work">See the work</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
