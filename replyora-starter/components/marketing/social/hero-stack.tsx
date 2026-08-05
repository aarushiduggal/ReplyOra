"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";

/**
 * Editorial "studio" hero. The three content cards SLAM in stacked, then fan
 * out side-by-side so all three photos are visible — with a big wordmark
 * scrolling behind. Drop three brand photos into the CARDS srcs to swap.
 */

type Card = {
  src: string;
  /** resting (spread) position */
  left: string;
  top: string;
  width: string;
  rotate: number;
  z: number;
  /** x offset that stacks it toward the centre before the fan-out */
  stackX: number;
  delay: number;
  floatDur: number;
  floatY: number;
  /** optional crop controls */
  bgSize?: string;
  pos?: string;
};

const CARDS: Card[] = [
  {
    // TEMP placeholder: mirrors the new centre photo. Drop the real left image
    // at public/marketing/hero-left.jpg to swap (no code change needed).
    src: "hero-left.jpg",
    left: "0%",
    top: "16%",
    width: "31%",
    rotate: -5,
    z: 10,
    stackX: 210,
    delay: 0.15,
    floatDur: 7,
    floatY: 10,
  },
  {
    src: "hero-center.jpg",
    left: "34.5%",
    top: "4%",
    width: "32%",
    rotate: 3,
    z: 30,
    stackX: 0,
    delay: 0.24,
    floatDur: 6,
    floatY: 14,
  },
  {
    // Third card: the filled-grid product screenshot. Drop a new image at
    // public/marketing/hero-right.jpg to swap (no code change needed).
    src: "hero-right.jpg",
    left: "69%",
    top: "16%",
    width: "31%",
    rotate: 6,
    z: 10,
    stackX: -210,
    delay: 0.33,
    floatDur: 8,
    floatY: 12,
    pos: "top",
  },
];

function StackCard({
  card,
  separated,
  reduce,
}: {
  card: Card;
  separated: boolean;
  reduce: boolean;
}) {
  return (
    <motion.div
      className="absolute aspect-[3/4]"
      style={{ left: card.left, top: card.top, width: card.width, zIndex: card.z }}
      initial={
        reduce
          ? false
          : { x: card.stackX, y: -190, opacity: 0, scale: 1.15, rotate: card.rotate }
      }
      animate={
        reduce
          ? undefined
          : {
              x: separated ? 0 : card.stackX,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: card.rotate,
            }
      }
      transition={{ type: "spring", stiffness: 190, damping: 20, delay: card.delay }}
    >
      <motion.div
        className="h-full w-full overflow-hidden rounded-[1.5rem] border-[6px] border-cream bg-oat shadow-2xl shadow-oxblood/20 ring-1 ring-oxblood/10"
        style={{
          backgroundImage: `url(/marketing/${card.src}), linear-gradient(150deg,#5C1A1A,#B26B62)`,
          backgroundSize: card.bgSize ?? "cover",
          backgroundPosition: card.pos ?? "center",
        }}
        animate={reduce ? undefined : { y: [0, -card.floatY, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: card.floatDur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.8,
              }
        }
      />
    </motion.div>
  );
}

export function HeroStack() {
  const reduce = useReducedMotion() ?? false;
  const [separated, setSeparated] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setSeparated(true), 1400);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute left-1/2 top-24 h-[32rem] w-[36rem] -translate-x-1/2 rounded-full bg-blush/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-24">
        {/* Kicker */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -22 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
          className="flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-[0.28em] text-rose"
        >
          Social media management platform
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-rose" />
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 210, damping: 13, delay: 0.24 }}
          className="mx-auto mt-5 max-w-4xl text-center font-display text-5xl leading-[1.02] text-wine sm:text-7xl"
        >
          The feed you&apos;d make{" "}
          <span className="italic text-oxblood">if you had the time.</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-ink/75"
        >
          Replyora plans, writes and schedules a month of on-brand content for
          Instagram &amp; TikTok — so your socials look effortless, because to
          you, they are.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
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
        </motion.div>

        {/* Stage: big scrolling wordmark + card stack that fans out */}
        <div className="relative mt-12 h-[26rem] sm:h-[32rem]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 w-screen max-w-none -translate-x-1/2 -translate-y-1/2 overflow-hidden">
            <motion.div
              className="flex whitespace-nowrap"
              animate={reduce ? undefined : { x: ["0%", "-50%"] }}
              transition={
                reduce ? undefined : { duration: 34, repeat: Infinity, ease: "linear" }
              }
            >
              {[0, 1].map((k) => (
                <span
                  key={k}
                  className="font-display text-[6.5rem] leading-none text-oxblood/[0.08] sm:text-[11rem]"
                >
                  plan&nbsp;·&nbsp;create&nbsp;·&nbsp;schedule&nbsp;·&nbsp;repeat&nbsp;·&nbsp;
                </span>
              ))}
            </motion.div>
          </div>

          <div className="absolute inset-0 mx-auto max-w-4xl">
            {CARDS.map((card) => (
              <StackCard
                key={card.src}
                card={card}
                separated={separated}
                reduce={reduce}
              />
            ))}

            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14, delay: 2.2 }}
              className="absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[12px] font-semibold text-oxblood shadow-lg backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              A month, scheduled
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
