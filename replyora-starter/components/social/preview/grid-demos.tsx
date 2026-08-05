"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Check, GripVertical, Sparkles } from "lucide-react";

/** Nine sample feed images for the mock grids. */
const FEED = [
  "feed-1.jpg",
  "feed-2.jpg",
  "feed-3.jpg",
  "feed-4.jpg",
  "feed-5.jpg",
  "feed-6.jpg",
  "feed-7.jpg",
  "feed-8.jpg",
  "feed-9.jpg",
];

function url(src: string) {
  return `/marketing/${src}`;
}

/* ------------------------------ Phone shell ------------------------------ */

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-xl shadow-oxblood/15 ring-1 ring-oxblood/10">
      <div className="flex items-center justify-between px-4 pt-3 text-[10px] font-medium text-ink/85">
        <span>9:41</span>
        <span>5G</span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-oxblood font-wordmark text-base text-cream">
          B
        </div>
        <div className="flex flex-1 justify-around text-center text-ink">
          <Stat n="9" label="Posts" />
          <Stat n="4.2k" label="Followers" />
          <Stat n="312" label="Following" />
        </div>
      </div>
      <p className="px-4 pb-2 text-sm font-semibold text-ink">Bloom Hair Studio</p>
      {children}
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{n}</p>
      <p className="text-[10px] text-ink/55">{label}</p>
    </div>
  );
}

/* --------------------- 1. Premium polish + live motion -------------------- */

export function PolishDemo() {
  return (
    <PhoneShell>
      <div className="grid grid-cols-3 gap-0.5 border-t border-oxblood/10 bg-oxblood/10">
        {FEED.map((src, i) => (
          <motion.div
            key={src}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.06, zIndex: 10 }}
            className="relative aspect-square cursor-grab bg-oat"
            style={{
              backgroundImage: `url(${url(src)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>
    </PhoneShell>
  );
}

/* -------------------------- 2. Grid intelligence -------------------------- */

const PALETTE = ["#5C1A1A", "#B26B62", "#D9AFA6", "#EAE3D2", "#3F1011"];

export function IntelligenceDemo() {
  return (
    <div className="grid gap-6 sm:grid-cols-[300px_1fr] sm:items-start">
      <div className="relative">
        <PhoneShell>
          <div className="relative grid grid-cols-3 gap-0.5 border-t border-oxblood/10 bg-oxblood/10">
            {FEED.map((src) => (
              <div
                key={src}
                className="aspect-square bg-oat"
                style={{
                  backgroundImage: `url(${url(src)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
            {/* "first impression" marker after row 2 */}
            <div className="pointer-events-none absolute inset-x-0 top-2/3 flex items-center gap-2">
              <span className="h-px flex-1 bg-oxblood/70" />
              <span className="rounded-full bg-oxblood px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cream">
                First impression
              </span>
              <span className="h-px flex-1 bg-oxblood/70" />
            </div>
          </div>
        </PhoneShell>
      </div>

      <div className="space-y-5">
        {/* Feed harmony */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
              Feed harmony
            </p>
            <p className="font-display text-lg text-oxblood">88%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-oat">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-oxblood to-rose"
              initial={{ width: "88%" }}
              animate={{ width: "88%" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-[11px] text-ink/55">
            Your tones are consistent — this feed reads as one brand.
          </p>
        </div>

        {/* Palette */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
            Your palette
          </p>
          <div className="mt-2 flex gap-1.5">
            {PALETTE.map((c) => (
              <span
                key={c}
                className="h-7 flex-1 rounded-md"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Best times */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/55">
            <CalendarClock className="h-3.5 w-3.5" /> Best times to post
          </p>
          <div className="flex flex-wrap gap-2">
            {["Tue 7pm", "Thu 6pm", "Sun 11am"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-oxblood/10 px-3 py-1 text-xs font-medium text-oxblood"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- 3. Power features ---------------------------- */

export function PowerDemo() {
  const [selected, setSelected] = useState<number[]>([1, 2]);

  function toggle(i: number) {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
      {/* Asset tray */}
      <div className="rounded-2xl border border-oxblood/10 bg-white p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/55">
          Assets — drag to place
        </p>
        <div className="grid grid-cols-2 gap-2">
          {["grid-1.jpg", "grid-2.jpg", "grid-3.jpg", "grid-4.jpg"].map((src) => (
            <div
              key={src}
              className="group relative aspect-square cursor-grab rounded-lg bg-oat ring-1 ring-oxblood/10"
              style={{
                backgroundImage: `url(${url(src)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span className="absolute right-1 top-1 rounded bg-white/85 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-3 w-3 text-ink/60" />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="max-w-[320px]">
          <div className="grid grid-cols-3 gap-0.5 rounded-xl bg-oxblood/10 p-0.5">
            {FEED.map((src, i) => {
              const isTarget = i === 4;
              const isSel = selected.includes(i);
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => toggle(i)}
                  className="relative aspect-square overflow-hidden bg-oat"
                  style={
                    isTarget
                      ? undefined
                      : {
                          backgroundImage: `url(${url(src)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                  }
                >
                  {isTarget ? (
                    <span className="flex h-full w-full items-center justify-center rounded-sm border-2 border-dashed border-oxblood/60 bg-oxblood/5 text-[9px] font-semibold uppercase tracking-wide text-oxblood">
                      Drop
                    </span>
                  ) : (
                    <span
                      className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border text-cream transition ${
                        isSel
                          ? "border-oxblood bg-oxblood"
                          : "border-white/70 bg-black/20"
                      }`}
                    >
                      {isSel && <Check className="h-3 w-3" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink/60">
            {selected.length} selected
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-3 py-1.5 text-xs font-semibold text-cream"
          >
            <CalendarClock className="h-3.5 w-3.5" /> Bulk schedule
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-oxblood/25 px-3 py-1.5 text-xs font-semibold text-oxblood"
          >
            <Sparkles className="h-3.5 w-3.5" /> Caption all
          </button>
        </div>
        <p className="text-[11px] text-ink/45">
          Tap tiles to multi-select · drag an asset onto the dashed slot to place
          it.
        </p>
      </div>
    </div>
  );
}
