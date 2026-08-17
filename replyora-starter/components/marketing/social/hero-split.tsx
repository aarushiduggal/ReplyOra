"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

import { Button } from "@/components/ui/button";

/**
 * Editorial split hero.
 *
 * Headline hard-left; one large photo bleeding off the right edge with two
 * smaller frames tucked into it. Quieter than a fanned stack — the composition
 * does the work, so the motion stays deliberately restrained: a settle on
 * entrance, a slow parallax as you scroll past, a small lean toward the cursor,
 * and a lift on hover. Nothing loops forever.
 *
 * To change the photos, drop files into public/marketing/ and edit PHOTOS below.
 * `depth` drives parallax and lean — higher = nearer the viewer = more travel.
 */

type Frame = {
  src: string;
  alt: string;
  /** Tailwind positioning for the frame within the photo column. */
  className: string;
  rotate: number;
  depth: number;
  delay: number;
  /** optional crop controls */
  bgSize?: string;
  bgPos?: string;
};

const PHOTOS: Frame[] = [
  {
    // The hero image. Bleeds past the right edge — the section clips it. Kept
    // narrow enough that the two tucked frames read as deliberate rather than
    // as clutter piled on top of it.
    src: "brand-1.jpg",
    alt: "Replyora brand photography",
    className: "right-[-10%] top-0 w-[62%] z-10",
    rotate: 1.5,
    depth: 1,
    delay: 0.18,
    bgSize: "118%",
    bgPos: "center 26%",
  },
  {
    // Product UI, overlapping the hero image's lower-left so the app is present
    // without covering the figure.
    src: "hero-left.jpg",
    alt: "The Replyora grid planner",
    className: "left-0 bottom-[4%] w-[46%] z-30",
    rotate: -6,
    depth: 0.55,
    delay: 0.28,
    bgPos: "top",
  },
  // A third frame (the styled flatlay) was tried here and removed. In a
  // half-width column it ended up wedged between the other two, showing only a
  // pale sliver — it read as a smudge rather than a photograph. Two frames with
  // real space around them is the stronger editorial composition. To bring it
  // back, add: { src: "hero-center.png", alt: "Styled content flatlay",
  // className: "left-[30%] top-[4%] w-[30%] z-20", rotate: 6, depth: 0.4,
  // delay: 0.34 } — and give the column more height so it isn't crowded.
];

export function HeroSplit() {
  const reduce = useReducedMotion() ?? false;
  const colRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: colRef,
    offset: ["start 85%", "end start"],
  });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, { stiffness: 110, damping: 20, mass: 0.4 });
  const tiltY = useSpring(rawY, { stiffness: 110, damping: 20, mass: 0.4 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function reset() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -right-24 top-10 h-[34rem] w-[34rem] rounded-full bg-blush/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:pb-28">
        {/* ── Words ─────────────────────────────────────────────────────── */}
        <div className="relative z-10">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone"
          >
            Socials, simplified
            <span className="inline-block h-1 w-1 rounded-full bg-stone" />
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.08 }}
            className="mt-5 max-w-xl font-display text-5xl leading-[1.03] text-wine sm:text-6xl"
          >
            The feed you&apos;d make{" "}
            <span className="italic text-oxblood">if you had the time.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/75"
          >
            Replyora plans, writes and schedules a month of on-brand content for
            Instagram, Facebook &amp; TikTok — so your socials look effortless,
            because to you, they are.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="link" className="text-ink">
              <Link href="/demo">Book a demo →</Link>
            </Button>
          </motion.div>
        </div>

        {/* ── Photos ────────────────────────────────────────────────────── */}
        <div
          ref={colRef}
          onPointerMove={onPointerMove}
          onPointerLeave={reset}
          className="relative h-[24rem] sm:h-[30rem] lg:h-[34rem]"
        >
          {PHOTOS.map((f) => (
            <SplitFrame
              key={f.src}
              frame={f}
              reduce={reduce}
              progress={scrollYProgress}
              tiltX={tiltX}
              tiltY={tiltY}
            />
          ))}

          {/*
            No floating badge here on purpose. An editorial composition earns
            its calm from empty space, and the copy already says a month is
            scheduled — a chip laid over the photography just added noise.
          */}
        </div>
      </div>
    </section>
  );
}

function SplitFrame({
  frame,
  reduce,
  progress,
  tiltX,
  tiltY,
}: {
  frame: Frame;
  reduce: boolean;
  progress: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
}) {
  // Scroll parallax and cursor lean, both scaled by depth so the group reads as
  // layered rather than sliding as one plane.
  const driftY = useTransform(progress, [0, 1], [0, -120 * frame.depth]);
  const leanY = useTransform(tiltX, (v) => v * 6 * frame.depth);
  const leanX = useTransform(tiltY, (v) => -v * 4 * frame.depth);

  return (
    <motion.div
      className={`absolute aspect-[3/4] ${frame.className}`}
      initial={
        reduce ? false : { opacity: 0, y: 34, scale: 0.94, rotate: frame.rotate * 2.2 }
      }
      animate={
        reduce ? undefined : { opacity: 1, y: 0, scale: 1, rotate: frame.rotate }
      }
      transition={{ type: "spring", stiffness: 170, damping: 20, delay: frame.delay }}
    >
      {/* Separate layer for parallax/lean so it can't fight the entrance spring. */}
      <motion.div
        className="h-full w-full"
        style={
          reduce
            ? undefined
            : { y: driftY, rotateX: leanX, rotateY: leanY, transformPerspective: 1200 }
        }
      >
        <motion.div
          role="img"
          aria-label={frame.alt}
          className="h-full w-full overflow-hidden rounded-[1.4rem] border-[6px] border-cream bg-oat shadow-2xl shadow-oxblood/20 ring-1 ring-oxblood/10"
          style={{
            backgroundImage: `url(/marketing/${frame.src}), linear-gradient(150deg,#5C1A1A,#B26B62)`,
            backgroundSize: frame.bgSize ?? "cover",
            backgroundPosition: frame.bgPos ?? "center",
          }}
          whileHover={
            reduce
              ? undefined
              : {
                  scale: 1.04,
                  rotate: -frame.rotate * 0.5,
                  boxShadow: "0 40px 80px -22px rgba(92,26,26,0.45)",
                  transition: { type: "spring", stiffness: 260, damping: 18 },
                }
          }
        />
      </motion.div>
    </motion.div>
  );
}
