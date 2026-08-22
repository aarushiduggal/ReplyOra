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
  /**
   * Live content instead of a photograph. Used for the product frame: a real
   * screenshot goes stale the moment the UI changes and blurs on retina, and a
   * 1MB JPEG in the hero is the single heaviest thing on the page.
   */
  render?: React.ReactNode;
};

const PHOTOS: Frame[] = [
  {
    // The hero image. Bleeds past the right edge — the section clips it. Kept
    // narrow enough that the two tucked frames read as deliberate rather than
    // as clutter piled on top of it.
    src: "hero-news-sitting.jpg",
    alt: "Replyora's founder reading The Business News",
    className: "right-[-9%] top-[2%] w-[54%] z-10",
    rotate: 1.5,
    depth: 1,
    delay: 0.18,
    bgSize: "112%",
    bgPos: "center 34%",
  },
  {
    // Product UI, lower-left. Overlaps the hero image's edge so the group reads
    // as one composition rather than three separate pictures.
    src: "hero-news-walking.jpg",
    alt: "Replyora campaign posters on the floor",
    className: "left-[16%] bottom-[2%] w-[46%] z-30",
    rotate: -5,
    depth: 0.55,
    delay: 0.28,
    bgPos: "center 62%",
  },
  {
    // The product itself, rendered live rather than screenshotted. Upper-left,
    // in its own clear zone — when it sat between the other two it showed only
    // a sliver and read as a smudge.
    src: "mini-grid",
    alt: "A client's planned feed in Replyora",
    className: "left-0 top-[4%] w-[36%] z-20",
    rotate: 6,
    depth: 0.4,
    delay: 0.36,
    render: <MiniGrid />,
  },
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
              <Link href="/waitlist">
                Join the waitlist <ArrowRight className="h-4 w-4" />
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
          className="relative h-[26rem] sm:h-[32rem] lg:h-[37rem]"
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
          style={
            frame.render
              ? undefined
              : {
                  backgroundImage: `url(/marketing/${frame.src}), linear-gradient(150deg,#5C1A1A,#B26B62)`,
                  backgroundSize: frame.bgSize ?? "cover",
                  backgroundPosition: frame.bgPos ?? "center",
                }
          }
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
        >
          {frame.render}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * A client's planned feed, rendered live in the hero.
 *
 * Deliberately not a screenshot: this stays sharp on retina, weighs nothing
 * next to a photograph, and can't drift out of date when the Grid changes.
 *
 * It renders the real Broadsheet furniture — masthead, platform tabs, the stat
 * rule, carousel and reel marks — at hero scale. Type sizes are absurdly small
 * on purpose: at ~250px wide the frame has to read as a dense, working tool
 * rather than three big words, which is what makes it look real.
 *
 * The sample client is invented. Showing Replyora's own account here would ask
 * an agency to picture the wrong thing.
 */
function MiniGrid() {
  const tiles = [
    { src: "grid-1.jpg", mark: "carousel" as const, n: 4 },
    { src: "grid-2.jpg", mark: "reel" as const, n: 0 },
    { src: "grid-3.jpg", mark: null, n: 0 },
    { src: "grid-4.jpg", mark: null, n: 0 },
    { src: "grid-5.jpg", mark: "carousel" as const, n: 3 },
    { src: "grid-6.jpg", mark: null, n: 0 },
    { src: "grid-7.jpg", mark: "reel" as const, n: 0 },
    { src: "grid-8.jpg", mark: null, n: 0 },
    { src: "feed-1.jpg", mark: null, n: 0 },
  ];
  return (
    <div className="flex h-full w-full flex-col bg-porcelain">
      {/* app chrome — the sliver that says "this is software" */}
      <div className="flex items-center gap-[3px] border-b border-ink/10 bg-cream px-2 py-[3px]">
        <span className="h-[3px] w-[3px] rounded-full bg-ink/20" />
        <span className="h-[3px] w-[3px] rounded-full bg-ink/20" />
        <span className="h-[3px] w-[3px] rounded-full bg-ink/20" />
        <span className="ml-1 font-serif text-[5px] italic text-ink/70">
          reply<span className="font-sans font-bold not-italic">ora.</span>
        </span>
        <span className="ml-auto rounded-full bg-ink px-[4px] py-[1px] text-[3.5px] font-bold uppercase tracking-[0.1em] text-cream">
          Add post
        </span>
      </div>

      {/* masthead */}
      <div className="border-b-[1.5px] border-ink px-2 pb-[3px] pt-[5px] text-center">
        <div className="flex items-center justify-between text-[3.2px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          <span>Connected</span>
          <span>The Grid</span>
          <span>16 Aug</span>
        </div>
        <p className="mt-[2px] text-balance font-display text-[11px] leading-[1] text-ink">
          Bloom Hair Studio
        </p>
        <div className="mt-[3px] flex justify-center gap-[7px] text-[3.4px] font-semibold uppercase tracking-[0.14em]">
          <span className="border-b border-ink pb-[1px] text-ink">Instagram</span>
          <span className="text-ink/30">Facebook</span>
          <span className="text-ink/30">TikTok</span>
        </div>
      </div>

      {/* stat rule */}
      <div className="flex justify-between border-b border-ink/70 px-2 py-[2px] text-[3.4px] font-semibold uppercase tracking-[0.14em] text-ink/65">
        <span>9 planned</span>
        <span>2 drafts</span>
        <span>Harmony 71%</span>
      </div>

      {/* the plate */}
      <div className="flex flex-1 gap-[3px] p-[5px]">
        <div className="grid flex-1 grid-cols-3 gap-[2px]">
          {tiles.map((t) => (
            <div
              key={t.src}
              className="relative bg-oat bg-cover bg-center"
              style={{ backgroundImage: `url(/marketing/${t.src})` }}
            >
              {t.mark === "carousel" && (
                <span className="absolute right-[1px] top-[1px] flex items-center gap-[1px] bg-ink/75 px-[2px] text-[3.2px] font-bold leading-[1.5] text-cream">
                  <span className="block h-[3px] w-[3px] border border-cream" />
                  {t.n}
                </span>
              )}
              {t.mark === "reel" && (
                <span className="absolute right-[1.5px] top-[1px] text-[4px] leading-none text-white drop-shadow">
                  ▶
                </span>
              )}
            </div>
          ))}
        </div>
        {/* assets rail */}
        <div className="flex w-[14%] flex-col gap-[2px]">
          {["feed-2.jpg", "feed-3.jpg", "feed-4.jpg"].map((a) => (
            <div
              key={a}
              className="aspect-square bg-oat bg-cover bg-center"
              style={{ backgroundImage: `url(/marketing/${a})` }}
            />
          ))}
          <div className="flex aspect-square items-center justify-center border border-dashed border-ink/25 text-[5px] leading-none text-ink/35">
            +
          </div>
        </div>
      </div>
    </div>
  );
}
