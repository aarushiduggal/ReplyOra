import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

/**
 * Editorial, photo-forward hero — an aesthetic content collage on the right,
 * a confident statement on the left. Uses the sourced content photos so it's
 * imagery, never colour blocks. Server component (Reveal handles entrance).
 */
export function HeroEditorial() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blush/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* Left — statement */}
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose">
            Social media management platform
            <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-rose" />
          </p>

          <h1 className="mt-5 font-display text-5xl leading-[1.02] text-wine sm:text-6xl">
            The feed you&apos;d make —{" "}
            <span className="italic text-oxblood">if you had the time.</span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/75">
            Replyora plans, writes and schedules a month of on-brand content for
            Instagram &amp; TikTok — so your socials look effortless, because to
            you, they are.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
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

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-ink/45">
            Content · planned · posted — free to start, no card
          </p>
        </Reveal>

        {/* Right — editorial photo collage */}
        <Reveal delay={0.12}>
          <div className="relative mx-auto aspect-[5/6] w-full max-w-md">
            {/* main */}
            <div
              role="img"
              aria-label="Aesthetic content"
              className="absolute inset-x-6 inset-y-0 rotate-[-2deg] overflow-hidden rounded-[2rem] border border-oxblood/10 bg-oat shadow-xl shadow-oxblood/10"
              style={{
                backgroundImage: "url(/marketing/feed-5.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* top-right accent */}
            <div
              role="img"
              aria-label="Content"
              className="absolute -right-2 top-6 h-32 w-28 rotate-[6deg] overflow-hidden rounded-2xl border-4 border-cream bg-oat shadow-lg"
              style={{
                backgroundImage: "url(/marketing/feed-1.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* bottom-left accent */}
            <div
              role="img"
              aria-label="Content"
              className="absolute -left-3 bottom-8 h-36 w-28 rotate-[-6deg] overflow-hidden rounded-2xl border-4 border-cream bg-oat shadow-lg"
              style={{
                backgroundImage: "url(/marketing/feed-7.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* floating "scheduled" chip */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-[11px] font-semibold text-oxblood shadow-lg backdrop-blur">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              A month, scheduled
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
