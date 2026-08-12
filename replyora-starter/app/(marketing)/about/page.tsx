import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Leaf, Sparkles } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About · Replyora",
  description:
    "The story behind Replyora — Socials, simplified. Why we built a calm, editorial way to plan, design and publish a month of on-brand content, and the values we run it by.",
};

const VALUES: { icon: typeof Heart; title: string; body: string }[] = [
  {
    icon: Heart,
    title: "Owner-first",
    body: "You started your business to do the thing you love — not to fight an algorithm at midnight. Everything we build gives you time back.",
  },
  {
    icon: Sparkles,
    title: "On brand, always",
    body: "No generic templates, no copy-paste captions. It should sound like you and look like you — because that's what people actually follow.",
  },
  {
    icon: Leaf,
    title: "Calm by design",
    body: "Marketing tools love to shout. Ours is quiet, warm and unhurried — a calm workspace that just gets the work done.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Founder hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 md:grid-cols-[1fr_0.85fr]">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Our story
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-wine sm:text-6xl">
              Hi, I&apos;m Aarushi. I built Replyora so you&apos;d never dread
              posting again.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
              I kept watching brilliant small businesses go quiet online — not for
              lack of ideas, but because content had quietly become a second
              full-time job. Great work, going unseen. That felt wrong.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
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
        </div>
      </section>

      {/* Why Replyora exists */}
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Why Replyora exists
            </p>
            <blockquote className="mt-5 font-display text-3xl leading-snug text-wine sm:text-4xl">
              &ldquo;Replyora is the version I wished they&apos;d had — the whole
              feed, handled, so the work speaks and the owner gets their evenings
              back.&rdquo;
            </blockquote>
            <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink/75">
              <p>
                So I started building. Not another dashboard that hands you more
                work, but a genuine team-in-a-tab: it learns your business, writes
                in your voice, designs your grid, plans a month of posts, and puts
                it live — with you approving in a couple of taps, or not at all if
                you&apos;d rather we just handle it.
              </p>
              <p>
                Then customers kept asking the same thing: &ldquo;Can it answer my
                website too?&rdquo; So we built the website chatbox — the same warm
                assistant, answering questions, capturing leads and booking
                enquiries 24/7. It&apos;s live in the corner of this very page.
              </p>
              <p>
                Whether you want it fully done for you or you&apos;d rather plan it
                yourself with better tools, you get the same care either way.
                That&apos;s the whole idea.
              </p>
            </div>
            <div className="mt-8">
              <p className="font-display text-lg text-oxblood">Aarushi</p>
              <p className="text-sm text-ink/55">Founder, Replyora</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Brand-shoot strip */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                file: "brand-1.jpg",
                gradient: "linear-gradient(150deg,#5C1A1A,#B26B62)",
                label: "Warm, editorial, unmistakably us.",
              },
              {
                file: "brand-2.jpg",
                gradient: "linear-gradient(150deg,#3F1011,#B26B62,#D9AFA6)",
                label: "Always moving — so your brand does too.",
              },
            ].map((p, i) => (
              <Reveal key={p.file} delay={i * 0.1}>
                <div
                  role="img"
                  aria-label={p.label}
                  className="relative flex aspect-[4/3] items-end overflow-hidden rounded-[2rem] border border-oxblood/10"
                  style={{
                    backgroundImage: `url(/marketing/${p.file}), ${p.gradient}`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                  <p className="relative m-6 font-display text-2xl text-cream">{p.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              What we believe
            </p>
            <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
              The values we run by.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-3xl border border-oxblood/10 bg-white p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-oxblood text-cream">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-xl text-wine">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="overflow-hidden rounded-[2rem] bg-oxblood px-8 py-20 text-center text-cream sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl sm:text-5xl">
              Let&apos;s give your feed the team it deserves.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              Start free, or book a demo and say hi — I&apos;d love to show you
              around.
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
