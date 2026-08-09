"use client";

import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  Check,
  LayoutGrid,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";

/**
 * Product page centrepiece — an interactive "two systems" switcher. It
 * auto-plays between the Content engine (a live animated toolkit) and the
 * Website chatbox (a real, typeable chat). Click a tab or type to take over.
 * Deliberately different from the homepage, and hands-on / live.
 */

// Fresh set (third-grid folder), not used elsewhere on the site.
const GRID_PHOTOS = [
  "prod-1.jpg",
  "prod-2.jpg",
  "prod-3.jpg",
  "prod-4.jpg",
  "prod-5.jpg",
  "prod-6.jpg",
];

/* ----------------------------- content tiles ----------------------------- */

function GridTile({ reduce }: { reduce: boolean }) {
  const [order, setOrder] = useState([0, 1, 2, 3, 4, 5]);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setOrder((o) => {
        const n = [...o];
        const i = Math.floor((Date.now() / 1000) % 5);
        const a = n[i]!;
        n[i] = n[i + 1]!;
        n[i + 1] = a;
        return n;
      });
    }, 1500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {order.map((idx) => (
        <motion.div
          key={idx}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="aspect-square overflow-hidden rounded-md bg-oat"
          style={{
            backgroundImage: `url(/marketing/${GRID_PHOTOS[idx]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </div>
  );
}

// Scheduled days hold a tiny planned-post thumbnail — not just a colour block.
const SCHEDULE: Record<number, string> = {
  1: "prod-7.jpg",
  4: "prod-8.jpg",
  6: "prod-9.jpg",
  9: "prod-1.jpg",
  11: "prod-2.jpg",
  15: "prod-3.jpg",
  17: "prod-6.jpg",
  20: "prod-4.jpg",
};

const SCHED_DAYS = Object.keys(SCHEDULE).map(Number);

function CalendarTile({ reduce }: { reduce: boolean }) {
  const days = SCHED_DAYS;
  const [dot, setDot] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setDot((d) => (d + 1) % SCHED_DAYS.length), 850);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 21 }).map((_, i) => {
        const photo = SCHEDULE[i];
        const lit = photo && days[dot] === i;
        if (photo) {
          return (
            <motion.div
              key={i}
              animate={lit && !reduce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.6 }}
              className={`aspect-square overflow-hidden rounded-[4px] ring-1 ${
                lit ? "ring-2 ring-oxblood" : "ring-oxblood/10"
              }`}
              style={{
                backgroundImage: `url(/marketing/${photo})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          );
        }
        return <div key={i} className="aspect-square rounded-[4px] bg-oat/70" />;
      })}
    </div>
  );
}

const CAPTIONS = [
  "New week, new drop ✨ tap to shop the edit →",
  "Behind the scenes of shoot day 🎬 #local",
  "The one product our regulars swear by 🤎",
];

function CaptionTile({ reduce }: { reduce: boolean }) {
  const [ci, setCi] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    if (reduce) {
      setText(CAPTIONS[0] ?? "");
      return;
    }
    const full = CAPTIONS[ci] ?? "";
    let i = 0;
    const type = setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(type);
        setTimeout(() => setCi((c) => (c + 1) % CAPTIONS.length), 1600);
      }
    }, 38);
    return () => clearInterval(type);
  }, [ci, reduce]);

  return (
    <div className="space-y-2">
      <p className="h-[4.25rem] text-[13px] leading-relaxed text-ink/80">
        {text}
        {!reduce && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-oxblood"
          />
        )}
      </p>

      <div className="flex gap-1.5">
        {["#glow", "#local", "#booknow"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] font-medium text-wine"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportTile({ reduce }: { reduce: boolean }) {
  const [reach, setReach] = useState(reduce ? 12400 : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, 12400, {
      duration: 1.6,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (v) => setReach(Math.round(v)),
    });
    return () => c.stop();
  }, [reduce]);

  return (
    <div className="space-y-3">
      {/* headline stat + sparkline */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink/45">
            Reach this month
          </p>
          <p className="font-display text-3xl leading-none text-oxblood">
            {reach.toLocaleString("en-AU")}
          </p>
          <p className="mt-1 text-[11px] font-medium text-emerald-600">
            ▲ 38% vs last month
          </p>
        </div>
        <svg viewBox="0 0 120 44" className="h-11 w-28 shrink-0">
          <motion.path
            d="M0 38 L20 30 L40 33 L60 20 L80 24 L100 10 L120 4"
            fill="none"
            stroke="#5C1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? undefined : { pathLength: 0 }}
            animate={reduce ? undefined : { pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* top post row */}
      <div className="flex items-center gap-3 rounded-xl border border-oxblood/10 bg-white p-2">
        <div
          className="h-10 w-10 shrink-0 rounded-lg bg-oat"
          style={{
            backgroundImage: "url(/marketing/prod-2.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ink">Top post</p>
          <p className="text-[11px] text-ink/55">Carousel · Thursday</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold text-oxblood">1,204</p>
          <p className="text-[10px] text-ink/45">likes</p>
        </div>
      </div>

      {/* monthly goal */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex justify-between text-[11px] text-ink/50">
          <span>Monthly goal</span>
          <span className="font-medium text-oxblood">78%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-oat">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose to-oxblood"
            initial={reduce ? undefined : { width: 0 }}
            animate={reduce ? undefined : { width: "78%" }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
            style={reduce ? { width: "78%" } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

const TOOLS = [
  { icon: LayoutGrid, title: "Grid planner", tile: GridTile },
  { icon: CalendarClock, title: "Content calendar", tile: CalendarTile },
  { icon: Sparkles, title: "AI captions", tile: CaptionTile },
  { icon: BarChart3, title: "Reports", tile: ReportTile },
];

function Tile({
  t,
  reduce,
}: {
  t: (typeof TOOLS)[number];
  reduce: boolean;
}) {
  return (
    <div className="rounded-2xl border border-oxblood/10 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-oxblood text-cream">
          <t.icon className="h-4 w-4" />
        </span>
        <p className="font-display text-lg text-wine">{t.title}</p>
      </div>
      <t.tile reduce={reduce} />
    </div>
  );
}

/**
 * Two columns that pack independently (masonry-style): the tall grid planner
 * sits above AI captions on the left; the short calendar lets Reports move up
 * beneath it on the right.
 */
function ContentPanel({ reduce }: { reduce: boolean }) {
  const grid = TOOLS[0]!;
  const calendar = TOOLS[1]!;
  const captions = TOOLS[2]!;
  const reports = TOOLS[3]!;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex flex-1 flex-col gap-4">
        <Tile t={grid} reduce={reduce} />
        <Tile t={captions} reduce={reduce} />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <Tile t={calendar} reduce={reduce} />
        <Tile t={reports} reduce={reduce} />
      </div>
    </div>
  );
}

/* ------------------------------ chat panel ------------------------------- */

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

/**
 * A *live* auto-playing conversation for a fake business (Rosewood, a hair &
 * skin studio). It types itself out on a loop, so visitors see the chatbox
 * working rather than having to drive it.
 */
const SCRIPT: ChatMsg[] = [
  { role: "assistant", text: "Hi! I'm the Rosewood assistant 🌹 How can I help today?" },
  { role: "user", text: "Do you have anything free this Saturday?" },
  {
    role: "assistant",
    text: "We do — a couple of afternoon spots left ✨ Want me to grab your name and pop you in?",
  },
  { role: "user", text: "Yes please — Ava, 0412 345 678" },
  { role: "assistant", text: "Booked you in for Saturday 2pm, Ava 🤎 See you then!" },
];

function ChatPanel({ reduce }: { reduce: boolean }) {
  const [count, setCount] = useState(reduce ? SCRIPT.length : 0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [count, typing]);

  useEffect(() => {
    if (reduce) return;
    if (count >= SCRIPT.length) {
      const t = setTimeout(() => setCount(0), 3200); // loop the conversation
      return () => clearTimeout(t);
    }
    const next = SCRIPT[count]!;
    if (next.role === "assistant") {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setCount((c) => c + 1);
      }, 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c + 1), 950);
    return () => clearTimeout(t);
  }, [count, reduce]);

  const shown = SCRIPT.slice(0, count);

  return (
    <div className="mx-auto flex h-[26rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-oxblood/15 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-oxblood px-4 py-3 text-cream">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/15">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm">Rosewood assistant</p>
          <p className="flex items-center gap-1.5 text-[11px] text-cream/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Online · live demo
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
        {shown.map((m, i) => (
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-oxblood text-cream"
                  : "rounded-bl-sm border border-oxblood/10 bg-white text-ink"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-oxblood/10 bg-white px-3.5 py-3">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* decorative composer — this demo plays on its own */}
      <div className="flex items-center gap-2 border-t border-oxblood/10 bg-white p-2.5">
        <div className="flex h-10 flex-1 items-center rounded-full border border-oxblood/20 bg-white px-4 text-[13px] text-ink/40">
          Ask Rosewood anything…
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxblood text-cream">
          <Send className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ showcase --------------------------------- */

const SYSTEMS = [
  {
    label: "Content engine",
    blurb:
      "Plan, create and schedule your Instagram, Facebook & TikTok — a whole month in one calm workspace.",
  },
  {
    label: "Website chatbox",
    blurb:
      "A warm AI assistant on your site — answering questions, capturing leads and booking 24/7.",
  },
];

export function ProductShowcase() {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % 2), 8000);
    return () => clearInterval(id);
  }, [reduce, paused]);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            Two systems, one login
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Your feed, and your front desk.
          </h2>
        </div>

        {/* Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-oxblood/15 bg-cream p-1">
            {SYSTEMS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  active === i ? "text-cream" : "text-ink/60 hover:text-oxblood"
                }`}
              >
                {active === i && (
                  <motion.span
                    layoutId="system-pill"
                    className="absolute inset-0 rounded-full bg-oxblood"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-ink/70">
          {SYSTEMS[active]?.blurb}
        </p>

        {/* Panels */}
        <div
          className="relative mt-8 min-h-[24rem]"
          onMouseEnter={() => setPaused(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4 }}
            >
              {active === 0 ? <ContentPanel reduce={reduce} /> : <ChatPanel reduce={reduce} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
