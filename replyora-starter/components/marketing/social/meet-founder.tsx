import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

/**
 * "Meet the founder" — editorial two-column intro: bio + CTA on the left,
 * the founder portrait on the right. Sits near the top of the homepage,
 * just under the feed grid.
 */
export function MeetFounder() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
            The face behind it
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Meet the founder
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 md:grid-cols-[1fr_0.82fr]">
          <Reveal>
            <p className="font-display text-2xl text-wine">
              Hello, <span className="italic">I&apos;m Aarushi.</span>
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-roseink">
              Founder of Replyora
            </p>

            <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/75">
              <p>
                As someone who&apos;s worked closely with businesses, I saw the
                same problem everywhere: content lived in one tool, approvals in
                another, messages in another, and everything else in spreadsheets.
              </p>
              <p>
                Replyora was built to bring it all together — one workspace to
                plan your content, manage your clients, and never miss a
                conversation.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/about">
                  Read the full story <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-oxblood/30"
              >
                <Link href="/demo">Say hello</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
            <div
              role="img"
              aria-label="Aarushi, founder of Replyora"
              className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-oxblood/10 bg-oat"
              style={{
                backgroundImage:
                  "url(/marketing/founder.jpg), linear-gradient(150deg,#5C1A1A,#B26B62)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
