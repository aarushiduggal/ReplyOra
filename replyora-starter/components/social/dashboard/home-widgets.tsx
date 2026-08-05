"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  FileText,
  PencilLine,
  Send,
} from "lucide-react";

import type { ActivityItem, OverviewStats } from "@/lib/social/overview";

/* ------------------------------- Cockpit --------------------------------- */

function Counter({ to, prefix = "" }: { to: number; prefix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => controls.stop();
  }, [to]);
  return (
    <>
      {prefix}
      {v.toLocaleString("en-AU")}
    </>
  );
}

/** At-a-glance stat tiles for the top of the studio dashboard. */
export function Cockpit({ stats }: { stats: OverviewStats }) {
  const tiles = [
    {
      label: "Scheduled",
      to: stats.scheduled,
      hint: "queued to post",
      live: stats.scheduled > 0,
    },
    { label: "In review", to: stats.inReview, hint: "awaiting client" },
    { label: "Published", to: stats.published, hint: "all time", spark: true },
    {
      label: "Outstanding",
      to: Math.round(stats.outstandingCents / 100),
      prefix: "$",
      hint: "unpaid invoices",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ y: 14 }}
          animate={{ y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-2xl border border-oxblood/10 bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">
              {s.label}
            </p>
            {s.live && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            )}
          </div>
          <p className="mt-2 font-display text-4xl text-oxblood">
            <Counter to={s.to} prefix={s.prefix} />
          </p>
          {s.spark && s.to > 0 ? (
            <svg viewBox="0 0 100 24" className="mt-1 h-6 w-full">
              <motion.path
                d="M0 20 L20 14 L40 16 L60 8 L80 11 L100 3"
                fill="none"
                stroke="#B26B62"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.3 }}
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

/* ------------------------------ Activity --------------------------------- */

const ICON = {
  scheduled: CalendarClock,
  published: Send,
  approved: Check,
  invoice: FileText,
  draft: PencilLine,
} as const;

/** Human "2m ago" style label from an ISO string. */
function relativeTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const future = diff < 0;
  const mins = Math.round(abs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return future ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return future ? "tomorrow" : "yesterday";
  if (days < 7) return future ? `in ${days}d` : `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

/** A running timeline of recent studio activity across clients. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-oxblood/15 bg-white/40 px-6 py-8 text-sm text-ink/50">
        No activity yet — schedule a post or send an invoice and it&apos;ll show
        up here.
      </div>
    );
  }

  return (
    <div className="relative max-w-xl pl-7">
      <div className="absolute left-[6px] top-2 bottom-2 w-px bg-oxblood/15" />
      <div className="space-y-4">
        {items.map((a, i) => {
          const Icon = ICON[a.kind];
          return (
            <motion.div
              key={i}
              initial={{ x: 12 }}
              animate={{ x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative flex items-center gap-3"
            >
              <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border border-oxblood/20 bg-white text-oxblood">
                <Icon className="h-3 w-3" />
              </span>
              <p className="flex-1 text-sm text-ink/80">{a.text}</p>
              <span className="whitespace-nowrap text-[11px] text-ink/40">
                {relativeTime(a.at)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
