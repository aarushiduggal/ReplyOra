"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Reveal } from "@/components/marketing/motion";

/**
 * Impact band — the big stat words roll through a few on-brand variants on a
 * gentle loop (slot-machine vertical roll), so the section is always subtly
 * alive. Warm cream field to match the rest of the site.
 */

const STATS: { words: string[]; small: string }[] = [
  { words: ["A month", "A week", "A season"], small: "of posts, planned in one sitting" },
  { words: ["2 taps", "One glance", "10 seconds"], small: "to approve a week of content" },
  { words: ["Every time", "On brand", "In your voice"], small: "colours, tone and voice — nailed" },
  { words: ["3 platforms", "Instagram", "Facebook", "TikTok"], small: "Instagram, Facebook & TikTok, one workspace" },
];

function Roller({
  words,
  delay,
  reduce,
}: {
  words: string[];
  delay: number;
  reduce: boolean;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => setI((v) => (v + 1) % words.length), 2600);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [words.length, delay, reduce]);

  if (reduce) {
    return (
      <span className="font-display text-4xl text-oxblood sm:text-5xl">
        {words[0]}
      </span>
    );
  }

  return (
    <span className="relative block h-[1.15em] overflow-hidden font-display text-4xl text-oxblood sm:text-5xl">
      <motion.span
        className="flex flex-col"
        animate={{ y: `${-i * 1.15}em` }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.3, 1] }}
      >
        {words.map((w) => (
          <span
            key={w}
            className="block h-[1.15em] whitespace-nowrap leading-[1.15em]"
          >
            {w}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function ImpactStats() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
            Why it feels different
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Less scrambling. More showing up.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.small} delay={i * 0.08}>
              <div className="border-t border-oxblood/15 pt-5">
                <Roller words={s.words} delay={i * 500} reduce={reduce} />
                <p className="mt-2 text-sm text-ink/60">{s.small}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
