import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";

/**
 * Editorial brand section — the two real brand-shoot photos shown FULL and
 * CLEAN (no text over them), each once. This is the "our brand is aesthetic"
 * moment; the words live above and beside the images, never on top of them.
 */

export function BrandStrip() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
            The brand, in real life
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Built with taste — it shows.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Replyora is a brand-first studio. The same eye we bring to our own
            shoots is the eye we bring to your feed.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div
              role="img"
              aria-label="Replyora editorial brand shoot"
              className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-oxblood/10 bg-oat"
              style={{
                backgroundImage: "url(/marketing/brand-1.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div
              role="img"
              aria-label="Replyora editorial brand shoot"
              className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-oxblood/10 bg-oat"
              style={{
                backgroundImage: "url(/marketing/brand-2.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-10">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-full border border-oxblood/25 px-5 py-2.5 text-sm font-medium text-oxblood transition-colors hover:bg-oxblood hover:text-cream"
          >
            See the work <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
