"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Live Playground hero — the visitor types their business and watches Replyora
 * generate a real on-brand post AND drop it onto a content calendar, live. It
 * demonstrates the core product (social media management: content + scheduling)
 * by doing it. Zero network calls — the generator runs in the browser, so it's
 * instant and free.
 */

interface Niche {
  match: string[];
  service: string;
  tip: string;
  tags: string[];
}

const NICHES: Niche[] = [
  { match: ["salon", "hair", "beauty", "barber"], service: "balayage", tip: "glossy winter hair that lasts", tags: ["hair", "balayage", "salonlife"] },
  { match: ["physio", "chiro", "osteo", "allied"], service: "recovery session", tip: "bouncing back after a big run", tags: ["physio", "recovery", "movewell"] },
  { match: ["gym", "fitness", "pilates", "yoga", "pt"], service: "intro session", tip: "getting back into it after a break", tags: ["fitness", "strongereveryday", "movement"] },
  { match: ["cafe", "coffee", "restaurant", "eatery", "roaster"], service: "weekend brunch", tip: "the new season menu", tags: ["cafe", "brunch", "coffeelover"] },
  { match: ["skin", "med spa", "cosmetic", "aesthetic", "derma"], service: "HydraFacial", tip: "prepping your skin for the season", tags: ["skincare", "facial", "glowup"] },
  { match: ["dental", "dentist", "ortho"], service: "check-up & clean", tip: "keeping that smile bright", tags: ["dentist", "smile", "healthyteeth"] },
];

const DEFAULT_NICHE: Niche = {
  match: [],
  service: "your services",
  tip: "what makes you different",
  tags: ["smallbusiness", "local", "supportlocal"],
};

function detectNiche(input: string): Niche {
  const lower = input.toLowerCase();
  return NICHES.find((n) => n.match.some((m) => lower.includes(m))) ?? DEFAULT_NICHE;
}

function titleCase(s: string): string {
  return (
    s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") ||
    "Your business"
  );
}

function makeCaption(biz: string, n: Niche): string {
  return `Save this if you keep meaning to book your ${n.service} 👇\n\nAt ${biz}, we make ${n.tip} easy — no fuss, just looked after. A few spots left this week.\n\nComment “BOOK” and we’ll sort you out.`;
}

/** Types `text` out character by character; resets whenever `text` changes. */
function useTypewriter(text: string, speed = 20, startDelay = 0): string {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(timer);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [text, speed, startDelay]);
  return out;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const SCHEDULE_DAYS = [1, 3, 5]; // Tue, Thu, Sat
const ROTATE = ["content", "captions", "calendar", "socials"];

export function PlaygroundHero() {
  const [draft, setDraft] = useState("Rosewood hair salon");
  const [business, setBusiness] = useState("Rosewood Hair Salon");
  const [seed, setSeed] = useState(0);
  const [rot, setRot] = useState(0);
  const [filled, setFilled] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setRot((r) => (r + 1) % ROTATE.length), 1800);
    return () => clearInterval(t);
  }, []);

  const niche = useMemo(() => detectNiche(business), [business]);
  const caption = useMemo(() => makeCaption(business, niche), [business, niche]);
  const tags = useMemo(
    () => [business.toLowerCase().replace(/[^a-z0-9]/g, ""), ...niche.tags].slice(0, 4),
    [business, niche],
  );
  const typedCaption = useTypewriter(caption, 16, 150);

  // Fill the calendar days one by one after the caption starts.
  useEffect(() => {
    setFilled([]);
    const timers = SCHEDULE_DAYS.map((d, i) =>
      setTimeout(() => setFilled((f) => [...f, d]), 1200 + i * 450),
    );
    return () => timers.forEach(clearTimeout);
  }, [business, seed]);

  function generate() {
    setBusiness(titleCase(draft));
    setSeed((s) => s + 1);
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* Left — pitch + playground input */}
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-roseink">
            Social media management platform
            <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-rose" />
          </p>

          <h1 className="mt-5 font-display text-5xl leading-[1.03] text-wine sm:text-6xl">
            We run your{" "}
            <span key={rot} className="italic text-oxblood" style={{ animation: "fadeIn 0.5s ease" }}>
              {ROTATE[rot]}
            </span>
            <span className="text-roseink">.</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
            The done-for-you social media platform. We create your posts, write
            your captions, and schedule a full month of content for Instagram &
            TikTok — on brand, every time.
          </p>

          {/* The live playground input */}
          <div className="mt-8 max-w-md">
            <label className="text-xs font-semibold uppercase tracking-widest text-ink/50">
              Try it — what’s your business?
            </label>
            <div className="mt-2 flex gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="e.g. hair salon, cafe, physio"
                className="h-11 flex-1 rounded-full border border-oxblood/25 bg-white px-4 text-sm text-ink outline-none focus:border-oxblood"
              />
              <Button onClick={generate} className="h-11 rounded-full px-5">
                <Wand2 className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/waitlist">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-oxblood/30">
              <Link href="/demo">See the work</Link>
            </Button>
          </div>
        </div>

        {/* Right — the living bento (content + calendar) */}
        <div className="flex flex-col gap-3">
          {/* Caption studio */}
          <div className="rounded-2xl border border-oxblood/10 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-roseink">
              <Sparkles className="h-3.5 w-3.5" /> Caption studio · Instagram
            </div>
            <p className="min-h-[92px] whitespace-pre-line text-[13px] leading-relaxed text-ink">
              {typedCaption}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-oxblood align-middle" />
            </p>
            <p className="mt-2 text-[12px] font-medium text-roseink">
              {tags.map((t) => `#${t}`).join(" ")}
            </p>
          </div>

          {/* Content calendar */}
          <div className="rounded-2xl border border-oxblood/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-roseink">
              <CalendarClock className="h-3.5 w-3.5" /> Scheduled this week
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d, i) => {
                const on = filled.includes(i);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-ink/40">{d}</span>
                    <span
                      className={`flex h-8 w-full items-center justify-center rounded-lg border text-[10px] transition-all duration-300 ${
                        on
                          ? "border-oxblood bg-oxblood text-cream"
                          : "border-oxblood/10 bg-oat/40 text-transparent"
                      }`}
                    >
                      {on ? "●" : "·"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[12px] text-ink/60">
              <span className="font-semibold text-oxblood">{filled.length} posts</span> queued
              for {business} — approve in one tap.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
