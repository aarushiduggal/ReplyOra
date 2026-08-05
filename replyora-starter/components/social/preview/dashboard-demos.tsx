"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  Check,
  FileText,
  LayoutGrid,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";

/* ------------------------------ 1. Cockpit ------------------------------- */

function Counter({ to, prefix = "" }: { to: number; prefix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, ease: [0.2, 0.7, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return <>{prefix}{v.toLocaleString("en-AU")}</>;
}

const STATS = [
  { label: "Scheduled", to: 24, hint: "this month", live: true },
  { label: "In review", to: 6, hint: "awaiting client" },
  { label: "Published", to: 112, hint: "all time", spark: true },
  { label: "Outstanding", to: 1240, prefix: "$", hint: "invoices" },
];

export function CockpitDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ y: 14 }}
          animate={{ y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl border border-oxblood/10 bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-ink/45">{s.label}</p>
            {s.live && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
          </div>
          <p className="mt-2 font-display text-4xl text-oxblood">
            <Counter to={s.to} prefix={s.prefix} />
          </p>
          {s.spark ? (
            <svg viewBox="0 0 100 24" className="mt-1 h-6 w-full">
              <motion.path
                d="M0 20 L20 14 L40 16 L60 8 L80 11 L100 3"
                fill="none"
                stroke="#B26B62"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.4 }}
              />
            </svg>
          ) : (
            <p className="mt-1 text-[11px] text-ink/45">{s.hint}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ----------------------------- 2. Activity ------------------------------- */

const ACTIVITY = [
  { icon: CalendarClock, text: "Scheduled 6 posts for Rosewood Studio", time: "2m ago" },
  { icon: Check, text: "Client approved this week's grid", time: "1h ago" },
  { icon: FileText, text: "Invoice #0042 sent to Lumen Social", time: "3h ago" },
  { icon: Sparkles, text: "Generated 12 captions in Studio", time: "yesterday" },
  { icon: MessageCircle, text: "Website chatbox booked an enquiry", time: "yesterday" },
];

export function ActivityDemo() {
  return (
    <div className="relative max-w-xl pl-7">
      <div className="absolute left-[6px] top-2 bottom-2 w-px bg-oxblood/15" />
      <div className="space-y-4">
        {ACTIVITY.map((a, i) => (
          <motion.div
            key={i}
            initial={{ x: 12 }}
            animate={{ x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative flex items-center gap-3"
          >
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border border-oxblood/20 bg-white text-oxblood">
              <a.icon className="h-3 w-3" />
            </span>
            <p className="flex-1 text-sm text-ink/80">{a.text}</p>
            <span className="text-[11px] text-ink/40">{a.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- 3. Command bar ----------------------------- */

const COMMANDS = [
  { icon: LayoutGrid, label: "Grid planner", hint: "Rosewood Studio" },
  { icon: CalendarClock, label: "Content calendar", hint: "Rosewood Studio" },
  { icon: Check, label: "Approvals", hint: "3 pending" },
  { icon: BarChart3, label: "Reports", hint: "Lumen Social" },
  { icon: MessageCircle, label: "Website chatbox", hint: "Rosewood Studio" },
  { icon: FileText, label: "Invoices", hint: "1 outstanding" },
];

export function CommandBarDemo() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-oxblood/20 bg-white px-4 py-2 text-sm text-ink/60 hover:border-oxblood/40"
      >
        <Search className="h-4 w-4" /> Search or jump to…
        <kbd className="ml-2 rounded bg-oat px-1.5 py-0.5 text-[11px] font-medium text-ink/60">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[18vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-oxblood/15 bg-cream shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-oxblood/10 px-4 py-3">
                <Search className="h-4 w-4 text-ink/40" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search clients & sections…"
                  className="flex-1 bg-transparent text-sm text-ink outline-none"
                />
                <kbd className="rounded bg-oat px-1.5 py-0.5 text-[10px] text-ink/50">esc</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-ink/40">No matches.</p>
                )}
                {results.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-oxblood/5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-oxblood/10 text-oxblood">
                      <c.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{c.label}</span>
                    <span className="text-[11px] text-ink/45">{c.hint}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
