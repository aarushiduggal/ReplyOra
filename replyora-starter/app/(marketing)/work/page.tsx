import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { WorkGallery } from "@/components/marketing/social/work-gallery";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Work · Replyora",
  description:
    "A feel for the content Replyora plans and produces — editorial brand shoots, reels, carousels and stories that stop the scroll.",
};

/** Editorial photo layered over a brand gradient (missing file → gradient). */
function Photo({
  file,
  gradient,
  label,
  className = "",
}: {
  file: string;
  gradient: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex items-end overflow-hidden rounded-[2rem] border border-oxblood/10 ${className}`}
      style={{
        backgroundImage: `url(/marketing/${file}), ${gradient}`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
      <p className="relative m-6 font-display text-2xl text-cream">{label}</p>
    </div>
  );
}

const MAKES: { title: string; body: string; gradient: string }[] = [
  {
    title: "Reels that get watched",
    body: "Short, punchy video concepts with hooks that hold — scripted, captioned and ready to publish.",
    gradient: "linear-gradient(135deg,#5C1A1A,#B26B62)",
  },
  {
    title: "Carousels that get saved",
    body: "Swipeable, genuinely useful posts your audience bookmarks and sends to a friend.",
    gradient: "linear-gradient(135deg,#B26B62,#D9AFA6)",
  },
  {
    title: "Stories that get replies",
    body: "Polls, this-or-that and behind-the-scenes moments that turn quiet followers into conversations.",
    gradient: "linear-gradient(135deg,#3F1011,#5C1A1A)",
  },
];

export default function WorkPage() {
  return (
    <>
      {/* Hero + editorial brand wall */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              The work
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-wine sm:text-6xl">
              Content with a point of view.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
              We&apos;re a warm, editorial studio at heart. Every post is planned
              in place — cohesive colours, a consistent voice, and a feed that
              actually feels curated. Here&apos;s the vibe.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3 md:grid-rows-2">
            <Reveal className="md:col-span-2 md:row-span-2">
              <Photo
                file="brand-1.jpg"
                gradient="linear-gradient(150deg,#5C1A1A,#B26B62)"
                label="Made to be read, saved and shared."
                className="aspect-[4/3] h-full md:aspect-auto"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <Photo
                file="brand-2.jpg"
                gradient="linear-gradient(150deg,#3F1011,#D9AFA6)"
                label="Always on the move."
                className="aspect-[4/3] h-full"
              />
            </Reveal>
            <Reveal delay={0.16}>
              <Photo
                file="work-1.jpg"
                gradient="linear-gradient(150deg,#B26B62,#EAE3D2)"
                label="On brand, every time."
                className="aspect-[4/3] h-full"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* What we make */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              What we make
            </p>
            <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
              Every format, handled.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {MAKES.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.08}>
                <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-oxblood/10 bg-white">
                  <div className="h-40 w-full" style={{ background: m.gradient }} />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl text-wine">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{m.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reuse the editorial gallery wall */}
      <WorkGallery />

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="overflow-hidden rounded-[2rem] bg-oxblood px-8 py-20 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl sm:text-5xl">
              Want a feed that looks like this?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              Tell us your business and we&apos;ll show you what your first month
              could look like.
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
