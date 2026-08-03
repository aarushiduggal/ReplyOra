"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Moon } from "lucide-react";

import { CountUp } from "@/components/marketing/motion";

const PINGS = [
  { t: "11:42pm", who: "Jordan M.", svc: "Initial assessment · Thu" },
  { t: "1:17am", who: "Mia R.", svc: "Balayage · Sat" },
  { t: "3:04am", who: "Dave T.", svc: "Emergency callout" },
  { t: "6:31am", who: "Ava L.", svc: "HydraFacial · Thu" },
];

export function WhileYouSleep() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "center 0.45"],
  });
  const nightOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const contentOpacity = useTransform(scrollYProgress, [0.25, 0.7], [0, 1]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-oat/40">
      {/* Night overlay fades in on scroll */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0 bg-linear-to-b from-wine via-oxblood to-ink"
        style={{ opacity: reduce ? 1 : nightOpacity }}
      />
      {/* Stars + moon */}
      <div aria-hidden className="absolute inset-0 z-[1]">
        <div className="absolute right-[12%] top-[16%] flex h-14 w-14 items-center justify-center rounded-full bg-cream/90 text-oxblood">
          <Moon className="h-7 w-7" />
        </div>
        {[
          ["18%", "24%"],
          ["30%", "60%"],
          ["52%", "20%"],
          ["68%", "72%"],
          ["80%", "40%"],
          ["44%", "84%"],
        ].map(([top, left], i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cream/70"
            style={{ top, left }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-6xl px-6 py-28"
        style={{ opacity: reduce ? 1 : contentOpacity }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blush">
            While you sleep
          </p>
          <h2 className="mt-3 font-display text-4xl text-cream sm:text-5xl">
            It never clocks off.
          </h2>
          <p className="mt-4 text-cream/70">
            Your best salesperson works the graveyard shift — answering,
            qualifying, and booking every enquiry that lands after hours.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-lg gap-3">
          {PINGS.map((p, i) => (
            <motion.div
              key={p.who}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.3 + i * 0.28 }}
              className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-cream/10 px-4 py-3 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f7d5f]/25 text-[#8fe3c2]">
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cream">
                  Booked — {p.who}
                </p>
                <p className="text-xs text-cream/60">{p.svc}</p>
              </div>
              <span className="shrink-0 text-xs text-cream/50">{p.t}</span>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-lg text-center">
          <p className="font-display text-3xl text-cream">
            <CountUp to={7} /> bookings captured overnight
          </p>
          <p className="mt-1 text-sm text-cream/60">
            An illustrative night — while the owner was asleep.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
