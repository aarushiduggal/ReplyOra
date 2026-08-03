"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { Magnetic } from "@/components/marketing/motion";

interface Scenario {
  q: string;
  a: string;
  n: string;
  s: string;
}
const DATA: Record<string, { name: string; scenarios: Scenario[] }> = {
  physio: {
    name: "Peak Physio",
    scenarios: [
      { q: "Do you treat sports injuries and take health-fund rebates?", a: "Yes — we treat sports and overuse injuries, and we do on-the-spot HICAPS rebates for most funds. Want me to book you an initial assessment?", n: "Jordan M.", s: "Initial assessment · Thu 4pm" },
      { q: "How much is a first consult?", a: "An initial physio assessment is $110 (about 45 min). I can hold a spot this week — what day suits you?", n: "Priya S.", s: "Assessment · Wed 9am" },
      { q: "Do you do dry needling?", a: "We do — our physios are dry-needling certified. Shall I lock in a session for you?", n: "Sam K.", s: "Dry needling · Sat 10am" },
    ],
  },
  salon: {
    name: "Bloom Hair Studio",
    scenarios: [
      { q: "How much for a balayage and how long does it take?", a: "Balayage starts at $180 and takes about 2.5 hours with a toner. I've got Saturday free — want me to book it?", n: "Mia R.", s: "Balayage · Sat 11am" },
      { q: "Do you have anything this weekend?", a: "Yes! I have Saturday morning and Sunday afternoon open. Which works better for you?", n: "Chloe D.", s: "Cut & colour · Sun 2pm" },
      { q: "Do you do keratin treatments?", a: "We do — keratin smoothing is $220 and lasts up to 4 months. Want me to pop you in?", n: "Ana P.", s: "Keratin · Fri 1pm" },
    ],
  },
  tradie: {
    name: "Peak Plumbing",
    scenarios: [
      { q: "Do you do emergency callouts tonight?", a: "We do 24/7 emergency callouts — a plumber can be there within the hour. What's the address and best number?", n: "Dave T.", s: "Emergency callout · tonight" },
      { q: "How much to fix a leaking hot water system?", a: "Most hot-water repairs run $180–$350 depending on the fault. I can send someone tomorrow morning — shall I book it?", n: "Ken L.", s: "Hot water repair · 8am" },
      { q: "Can you unblock a drain tomorrow?", a: "Easily — we can clear a blocked drain first thing tomorrow. Want me to lock in a morning slot?", n: "Rhea N.", s: "Drain clear · 7:30am" },
    ],
  },
  medspa: {
    name: "Coastal Glow",
    scenarios: [
      { q: "How much is a HydraFacial and is there downtime?", a: "A HydraFacial is $189 (45–60 min) with zero downtime. I can book you this week — what day works?", n: "Ava L.", s: "HydraFacial · Thu 5pm" },
      { q: "Do you offer Afterpay on injectables?", a: "We do offer Afterpay — a nurse consult comes first. Want me to grab you a consult time?", n: "Zoe H.", s: "Nurse consult · Tue 6pm" },
      { q: "Can I get a skin consult first?", a: "Of course — a skin consult is $50 and comes off your first treatment. Shall I book it in?", n: "Lena T.", s: "Skin consult · Mon 11am" },
    ],
  },
  dentist: {
    name: "Corso Dental",
    scenarios: [
      { q: "How much is a check-up and clean, and do you take my health fund?", a: "A check-up and clean is $180, and we do on-the-spot HICAPS rebates for most funds — often no gap. Want me to book you in?", n: "Harper W.", s: "Check-up & clean · Wed 2pm" },
      { q: "Can I get in for a toothache today?", a: "Sorry you're in pain! We keep emergency slots each day — I can get you seen this afternoon. What's your name and best number?", n: "Leo M.", s: "Emergency · today 3:30pm" },
      { q: "Do you do teeth whitening?", a: "We do — in-chair whitening is $450 and takes about an hour. Shall I find you a time?", n: "Ruby S.", s: "Whitening · Fri 10am" },
    ],
  },
  gym: {
    name: "Forge Fitness",
    scenarios: [
      { q: "How much is a membership and is there a free trial?", a: "Memberships start at $22/week with no lock-in, and yes — you can grab a free 3-day trial pass. Want me to set one up for you?", n: "Cody R.", s: "Free trial · starts Sat" },
      { q: "What are your class times?", a: "We run classes 6am–8pm daily — HIIT, spin, yoga and strength. Want me to book you into one this week?", n: "Mia T.", s: "HIIT class · Mon 6pm" },
      { q: "Do you have personal trainers?", a: "We do — PT packages start at $60/session and your first is complimentary. Shall I lock in your intro session?", n: "Jak P.", s: "Intro PT · Thu 7am" },
    ],
  },
  law: {
    name: "Harbour Legal",
    scenarios: [
      { q: "Do you offer a free first consult for a property purchase?", a: "Yes — the first 20-minute consult is complimentary, and conveyancing is a fixed fee from $990. Want me to book your consult?", n: "Dana K.", s: "Consult · Wed 11am" },
      { q: "Can you help with a will?", a: "Absolutely — we prepare wills and estate plans from $440 fixed fee. I can book you a time with our estates team. What's your name and email?", n: "Peter H.", s: "Wills consult · Tue 4pm" },
      { q: "How much for a family law matter?", a: "It depends on the matter, so we start with a fixed-fee initial consult ($150, credited if you proceed). Shall I find you a time this week?", n: "Sara L.", s: "Family law · Fri 9am" },
    ],
  },
  cafe: {
    name: "The Corner Café",
    scenarios: [
      { q: "Can I book a table for 6 tonight?", a: "We'd love to have you! I can hold a table for 6 — what time suits, and what's the name for the booking?", n: "Tom B.", s: "Table for 6 · tonight 7pm" },
      { q: "Do you cater for events?", a: "We do — catering packages start at $18pp for grazing and $28pp for hot buffets. Want me to send options and hold a date?", n: "Elly N.", s: "Catering enquiry · 45 pax" },
      { q: "Do you have vegan and gluten-free options?", a: "Plenty! Most of our menu can be made vegan or GF — just flag it on the day. Shall I book you a table?", n: "Grace O.", s: "Table for 2 · Sun 9am" },
    ],
  },
};
const INDUSTRIES: { key: string; label: string }[] = [
  { key: "physio", label: "Physio" },
  { key: "salon", label: "Salon" },
  { key: "dentist", label: "Dentist" },
  { key: "gym", label: "Gym" },
  { key: "tradie", label: "Tradie" },
  { key: "law", label: "Law firm" },
  { key: "cafe", label: "Café" },
  { key: "medspa", label: "Med spa" },
];
const WORDS = ["booked customers.", "captured leads.", "5-star reviews.", "filled calendars."];

const STOP = new Set(["the", "a", "and", "or", "do", "you", "i", "is", "for", "how", "much", "can", "to", "my", "me", "of", "on", "at", "it", "this", "that", "what", "are", "with", "in", "your", "get", "have", "does", "any"]);

/**
 * Client-side demo responder — answers from the SELECTED industry's knowledge so
 * the take-over stays consistent (a physio question never gets a med-spa answer).
 * It's a scripted demo; the real widget uses /api/chat (Claude when keyed).
 */
function heroReply(industry: string, msg: string): string {
  const d = DATA[industry]!;
  const q = msg.toLowerCase();
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(msg) || /\+?\d[\d\s-]{7,}\d/.test(msg)) {
    return `Perfect — thanks! I've passed your details to the ${d.name} team and they'll be in touch shortly. Anything else I can help with?`;
  }
  const words = q.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  let best: Scenario | null = null;
  let bestScore = 0;
  for (const s of d.scenarios) {
    const sw = s.q.toLowerCase();
    let score = 0;
    for (const w of words) if (sw.includes(w)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (bestScore === 0) {
    if (/price|cost|how much|\$|fee|rate|charge/.test(q)) {
      best = d.scenarios.find((s) => s.a.includes("$")) ?? d.scenarios[1] ?? d.scenarios[0]!;
    } else if (/book|avail|friday|saturday|sunday|monday|tuesday|today|tomorrow|time|slot|appointment|when|weekend/.test(q)) {
      best = d.scenarios.find((s) => /book|slot|time|when/i.test(s.a)) ?? d.scenarios[0]!;
    }
  }
  if (best) return best.a;
  return `Great question! Leave your name and best email or mobile and the ${d.name} team will get right back to you — usually within minutes.`;
}

type FeedItem =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "typing" }
  | { kind: "lead"; text: string }
  | { kind: "book"; text: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [industry, setIndustry] = useState("physio");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [takenOver, setTakenOver] = useState(false);
  const [input, setInput] = useState("");
  const [word, setWord] = useState<string>(reduce ? WORDS[0]! : "");

  // ---- self-playing demo loop ----
  useEffect(() => {
    if (takenOver) return;
    let cancelled = false;

    const run = async () => {
      const sc = DATA[industry]!.scenarios;
      if (reduce) {
        const s = sc[0]!;
        setFeed([
          { kind: "user", text: s.q },
          { kind: "assistant", text: s.a },
          { kind: "lead", text: `Lead captured — ${s.n}` },
          { kind: "book", text: `Booked — ${s.s}` },
        ]);
        return;
      }
      let i = 0;
      while (!cancelled) {
        const s = sc[i % sc.length]!;
        setFeed([{ kind: "user", text: s.q }]);
        await wait(650);
        if (cancelled) return;
        setFeed((f) => [...f, { kind: "typing" }]);
        await wait(950);
        if (cancelled) return;
        setFeed((f) => [...f.filter((x) => x.kind !== "typing"), { kind: "assistant", text: "" }]);
        for (let c = 1; c <= s.a.length; c++) {
          if (cancelled) return;
          const txt = s.a.slice(0, c);
          setFeed((f) => {
            const cp = [...f];
            cp[cp.length - 1] = { kind: "assistant", text: txt };
            return cp;
          });
          await wait(15);
        }
        await wait(450);
        if (cancelled) return;
        setFeed((f) => [...f, { kind: "lead", text: `Lead captured — ${s.n}` }]);
        await wait(750);
        if (cancelled) return;
        setFeed((f) => [...f, { kind: "book", text: `Booked — ${s.s}` }]);
        await wait(2300);
        if (cancelled) return;
        i++;
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [industry, takenOver, reduce]);

  // ---- typewriter headline ----
  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    let wi = 0;
    const run = async () => {
      while (!cancelled) {
        const w = WORDS[wi % WORDS.length]!;
        for (let i = 1; i <= w.length; i++) {
          if (cancelled) return;
          setWord(w.slice(0, i));
          await wait(55);
        }
        await wait(1500);
        for (let j = w.length; j >= 0; j--) {
          if (cancelled) return;
          setWord(w.slice(0, j));
          await wait(28);
        }
        await wait(180);
        wi++;
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  // ---- cursor-reactive blob ----
  const rootRef = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    const blob = blobRef.current;
    if (!root || !blob) return;
    let tx = root.clientWidth * 0.35,
      ty = 180,
      cx = tx,
      cy = ty,
      raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      blob.style.transform = `translate(${cx - 210}px, ${cy - 210}px)`;
      raf = requestAnimationFrame(loop);
    };
    root.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      root.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // ---- visitor take-over — answers from the selected industry's knowledge ----
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setInput("");
    setTakenOver(true);
    setFeed((f) => [...f, { kind: "user", text: v }, { kind: "typing" }]);
    const answer = heroReply(industry, v);
    await wait(reduce ? 200 : 750);
    setFeed((f) => [...f.filter((x) => x.kind !== "typing"), { kind: "assistant", text: "" }]);
    for (let c = 1; c <= answer.length; c++) {
      const txt = answer.slice(0, c);
      setFeed((f) => {
        const cp = [...f];
        cp[cp.length - 1] = { kind: "assistant", text: txt };
        return cp;
      });
      await wait(reduce ? 0 : 14);
    }
  }

  function resume() {
    setTakenOver(false);
    setFeed([]);
  }
  function pickIndustry(k: string) {
    setTakenOver(false);
    setIndustry(k);
    setFeed([]);
  }

  return (
    <section
      ref={rootRef}
      id="product"
      className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_90%_5%,#F3ECDD_0%,rgba(243,236,221,0)_55%),radial-gradient(90%_80%_at_0%_100%,#F1E7DA_0%,rgba(241,231,218,0)_60%)] bg-cream"
    >
      {/* ambience */}
      {!reduce && (
        <>
          {/* Cursor-follow blob + floating squares are mouse-driven decoration —
              hidden on phones where they only crowd/overlap the headline. */}
          <div
            ref={blobRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-0 hidden h-[420px] w-[420px] rounded-full blur-[10px] md:block"
            style={{ background: "radial-gradient(circle, rgba(178,107,98,.24), rgba(217,175,166,.12) 45%, rgba(234,227,210,0) 72%)" }}
          />
          <div aria-hidden className="pointer-events-none absolute right-[12%] top-[14%] z-0 hidden h-6 w-6 animate-pulse rounded-md border border-rose/50 md:block" />
          <div aria-hidden className="pointer-events-none absolute left-[8%] bottom-[16%] z-0 hidden h-5 w-5 animate-pulse rounded-md border border-blush/60 md:block" style={{ animationDelay: "1s" }} />
        </>
      )}

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:py-24">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-rose/40 bg-oat/70 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-wine sm:text-xs">
            <span className="rly-odot h-2 w-2 rounded-full border-[1.7px] border-oxblood" />
            AI that books while you sleep
          </span>
          <h1 className="mt-5 font-display text-[2.1rem] leading-[1.1] text-oxblood sm:mt-6 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
            Turn website visitors into
            <br />
            <span className="text-wine">
              {word}
              {!reduce && <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-rose align-middle" style={{ height: "0.9em" }} />}
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-ink/80 sm:mt-6 sm:text-lg">
            Replyora replies instantly from your own knowledge, captures the lead,
            qualifies it, and books the job — 24/7, in your brand voice.
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-ink/50 sm:mt-7">
            Try it for your business
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {INDUSTRIES.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => pickIndustry(it.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
                  industry === it.key
                    ? "border-oxblood bg-oxblood text-cream"
                    : "border-oxblood/20 bg-white text-oxblood hover:bg-oat"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
            <Magnetic strength={0.35}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-oxblood px-6 py-3.5 text-sm font-semibold text-cream shadow-[0_10px_24px_rgba(92,26,26,.24)] transition-shadow hover:shadow-[0_14px_30px_rgba(92,26,26,.34)]"
              >
                Start 7-day trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
            <Link
              href="/demo"
              className="inline-flex items-center rounded-xl border border-oxblood/20 bg-white px-6 py-3.5 text-sm font-semibold text-oxblood transition-colors hover:bg-oat"
            >
              Book a demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink/60">
            No card to start · cancel anytime · love it in 30 days or your setup
            fee back.
          </p>
        </div>

        {/* Right — self-playing demo */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-[22px] border border-oxblood/10 bg-white shadow-[0_24px_60px_rgba(63,16,17,.18)]">
            <div className="flex items-center gap-2.5 border-b border-oxblood/8 bg-linear-to-b from-white to-cream px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood font-wordmark text-base text-cream">
                r°
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{DATA[industry]!.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-[#2f7d5f]">
                  <span className="h-[7px] w-[7px] rounded-full bg-[#2f7d5f]" /> Online
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-oat px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-wine">
                <Sparkles className="h-3 w-3" /> Live demo
              </span>
            </div>

            <div className="flex h-[300px] flex-col gap-2.5 overflow-hidden bg-[radial-gradient(80%_60%_at_100%_0%,rgba(234,227,210,.5),rgba(255,255,255,0)_60%)] p-4">
              {feed.map((it, i) => {
                if (it.kind === "user")
                  return (
                    <div key={i} className="rly-pop max-w-[84%] self-end rounded-2xl rounded-br-md bg-oat px-3 py-2 text-[13px] leading-snug text-ink">
                      {it.text}
                    </div>
                  );
                if (it.kind === "assistant")
                  return (
                    <div key={i} className="rly-pop max-w-[84%] self-start rounded-2xl rounded-bl-md border border-oxblood/10 bg-white px-3 py-2 text-[13px] leading-snug text-ink/85">
                      {it.text}
                    </div>
                  );
                if (it.kind === "typing")
                  return (
                    <div key={i} className="rly-pop max-w-[84%] self-start rounded-2xl rounded-bl-md border border-oxblood/10 bg-white px-3 py-2.5">
                      <span className="inline-flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="rly-dot h-1.5 w-1.5 rounded-full bg-rose" />
                        ))}
                      </span>
                    </div>
                  );
                if (it.kind === "lead")
                  return (
                    <div key={i} className="rly-pop inline-flex items-center gap-1.5 self-start rounded-full bg-rose/15 px-3 py-1 text-[11.5px] font-semibold text-oxblood">
                      ◆ {it.text}
                    </div>
                  );
                return (
                  <div key={i} className="rly-book inline-flex items-center gap-1.5 self-start rounded-full bg-[#2f7d5f]/12 px-3 py-1 text-[11.5px] font-semibold text-[#2f7d5f]">
                    ✓ {it.text}
                  </div>
                );
              })}
            </div>

            {takenOver && (
              <button
                type="button"
                onClick={resume}
                className="absolute bottom-[62px] left-1/2 -translate-x-1/2 rounded-full bg-oxblood px-3.5 py-1.5 text-[11.5px] font-semibold text-cream shadow-[0_6px_16px_rgba(92,26,26,.3)]"
              >
                ▶ Resume demo
              </button>
            )}

            <form onSubmit={onSubmit} className="flex gap-2 border-t border-oxblood/8 bg-white p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setTakenOver(true)}
                placeholder="Ask anything…"
                className="flex-1 rounded-full border border-oxblood/15 px-4 py-2 text-[13px] outline-none focus:border-rose"
              />
              <button type="submit" aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood text-cream">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
