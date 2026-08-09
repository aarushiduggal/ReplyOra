"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { Logo } from "@/components/brand/logo";

/**
 * "How it works" — Option A. A mini device auto-plays the workflow on a loop:
 * brand details fill in → the grid fills with photos → posts are scheduled.
 * The three step labels highlight in sync.
 */

const STEPS = [
  {
    title: "Add your business",
    body: "Tell Replyora your services, voice and look once — it learns your brand in minutes.",
  },
  {
    title: "Create & plan",
    body: "Generate on-brand posts and captions with AI, then arrange your whole month on the grid.",
  },
  {
    title: "Schedule & publish",
    body: "Approve and it posts to Instagram & Facebook on time — while you get back to business.",
  },
];

const PHOTOS = [
  "how-1.jpg",
  "how-2.jpg",
  "how-3.jpg",
  "how-4.jpg",
  "how-5.jpg",
  "how-6.jpg",
  "how-7.jpg",
  "how-8.jpg",
  "how-9.jpg",
];

function MiniGrid({ scheduled }: { scheduled: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {PHOTOS.map((p, i) => (
        <motion.div
          key={p}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.09, duration: 0.35 }}
          className="relative aspect-square overflow-hidden rounded-md bg-oat"
          style={{
            backgroundImage: `url(/marketing/${p})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {scheduled && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"
            >
              <Check className="h-2.5 w-2.5" />
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Panel({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">
            Business
          </p>
          <div className="mt-1 flex items-center rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm text-ink">
            Rosewood Studio
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-0.5 inline-block h-4 w-px bg-oxblood"
            />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">
            Your vibe
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["warm", "editorial", "rose", "minimal"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.18 }}
                className="rounded-full bg-rose/15 px-2.5 py-1 text-[12px] font-medium text-wine"
              >
                {t}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="!mt-5 flex items-center gap-2 rounded-lg bg-oxblood/5 px-3 py-2 text-[12px] text-oxblood">
          <Sparkles className="h-3.5 w-3.5" /> Learning your brand…
        </div>
      </div>
    );
  }
  if (stage === 1) {
    return (
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink/45">
          Your month, on the grid
        </p>
        <MiniGrid scheduled={false} />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">
          Scheduled
        </p>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <Check className="h-3 w-3" /> Live for the month
        </span>
      </div>
      <MiniGrid scheduled />
    </div>
  );
}

export function HowDemo() {
  const reduce = useReducedMotion() ?? false;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 3), 3000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section id="how" className="scroll-mt-20 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            One workspace — from idea to posted.
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const active = stage === i;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStage(i)}
                  className={`flex w-full gap-4 rounded-2xl border p-5 text-left transition-colors ${
                    active
                      ? "border-oxblood/20 bg-white shadow-sm"
                      : "border-transparent hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg transition-colors ${
                      active
                        ? "bg-oxblood text-cream"
                        : "bg-oxblood/10 text-oxblood"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3
                      className={`font-display text-xl ${active ? "text-wine" : "text-ink/70"}`}
                    >
                      {s.title}
                    </h3>
                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden text-sm leading-relaxed text-ink/70"
                        >
                          <span className="mt-1.5 block">{s.body}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Device */}
          <Reveal delay={0.1} className="mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-oxblood/15 bg-white p-3 shadow-xl shadow-oxblood/10">
              <div className="rounded-[1.6rem] border border-oxblood/10 bg-cream p-5">
                {/* top bar */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-rose/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-rose/15" />
                  <span className="ml-auto">
                    <Logo variant="mark" height={18} asLink={false} />
                  </span>
                </div>
                <div className="min-h-[15rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Panel stage={stage} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
