"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Instagram, Printer } from "lucide-react";

import type { ClientPost } from "@/lib/social/posts";
import { PLATFORM_LABEL } from "@/lib/social/types";

export function ReportsWorkspace({
  clientId,
  clientName,
  connected,
  posts,
  reportTitle,
  todayISO,
}: {
  clientId: string;
  clientName: string;
  connected: boolean;
  posts: ClientPost[];
  reportTitle: string;
  todayISO: string;
}) {
  const monthAgo = useMemo(() => {
    const d = new Date(todayISO);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, [todayISO]);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(todayISO);
  const [range, setRange] = useState({ from: monthAgo, to: todayISO });
  const [summary, setSummary] = useState(
    `${clientName} stayed consistent this period. Educational content led reach; keep the cadence and lean into what's working.`,
  );

  const inRange = useMemo(
    () =>
      posts.filter((p) => {
        const d = (p.scheduledFor ?? p.createdAt).slice(0, 10);
        return d >= range.from && d <= range.to;
      }),
    [posts, range],
  );

  const prevWindow = useMemo(() => {
    const days = Math.max(
      1,
      Math.round((new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000),
    );
    const prevTo = new Date(range.from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - days);
    const pf = prevFrom.toISOString().slice(0, 10);
    const pt = prevTo.toISOString().slice(0, 10);
    return posts.filter((p) => {
      const d = (p.scheduledFor ?? p.createdAt).slice(0, 10);
      return d >= pf && d <= pt;
    }).length;
  }, [posts, range]);

  const pillars = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of inRange) {
      const k = p.pillar || "Other";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [inRange]);
  const maxPillar = pillars[0]?.[1] ?? 1;

  const delta = inRange.length - prevWindow;

  if (!connected) {
    return (
      <div>
        <Header title={reportTitle} />
        <div className="mt-8 rounded-2xl border border-dashed border-ink/25 px-8 py-16 text-center">
          <Instagram className="mx-auto h-8 w-8 text-ink/40" />
          <h3 className="mt-3 font-display text-2xl text-oxblood">Instagram not connected</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-ink/75">
            Connect {clientName}&apos;s Instagram to pull live performance data — reach,
            engagement and follower growth.
          </p>
          <Link
            href={`/clients/${clientId}/integrations`}
            className="mt-5 inline-block rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect under Integrations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={reportTitle} />

      {/* date range */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-oxblood/20 px-3 py-1.5 text-sm outline-none focus:border-oxblood" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-oxblood/20 px-3 py-1.5 text-sm outline-none focus:border-oxblood" />
        </div>
        <button
          type="button"
          onClick={() => setRange({ from, to })}
          className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
        >
          Update report
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 hover:border-oxblood hover:text-oxblood print:hidden"
        >
          <Printer className="h-3.5 w-3.5" /> Save as PDF
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-ink/55">Data available for the last 365 days.</p>

      {/* stat cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Posts this period" value={String(inRange.length)} sub={`${delta >= 0 ? "+" : ""}${delta} vs previous`} up={delta >= 0} />
        <Stat label="Previous period" value={String(prevWindow)} sub="same length window" />
        <Stat label="Content pillars" value={String(pillars.length)} sub="in play this period" />
      </div>

      {/* pillar breakdown */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Pillar breakdown</p>
        {pillars.length === 0 ? (
          <p className="mt-3 text-[12px] text-ink/60">No posts in this period.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pillars.map(([name, n]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[12px] font-medium text-ink/80">{name}</span>
                <span className="h-3 rounded-full bg-oxblood" style={{ width: `${(n / maxPillar) * 100}%`, minWidth: "8px" }} />
                <span className="text-[11px] text-ink/60">{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* top posts */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Top posts</p>
        <div className="mt-3 space-y-2">
          {inRange.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-2.5">
              <span className="text-[13px] text-ink">{p.caption ? p.caption.slice(0, 60) : "(untitled)"}</span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink/55">
                {p.scheduledFor?.slice(0, 10)} · {PLATFORM_LABEL[p.platform]}
              </span>
            </div>
          ))}
          {inRange.length === 0 && <p className="text-[12px] text-ink/60">No posts to rank yet.</p>}
        </div>
      </div>

      {/* editable exec summary */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Executive summary</p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
        />
      </div>

      <p className="mt-6 text-[11px] text-ink/55">
        Reach, impressions and engagement populate here once Instagram is connected with
        analytics access.
      </p>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div>
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
        <span className="text-oxblood">( Reports )</span> Instagram
      </p>
      <h2 className="mt-3 font-display text-3xl text-oxblood">{title}</h2>
    </div>
  );
}

function Stat({ label, value, sub, up }: { label: string; value: string; sub: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-ink/10 px-4 py-3">
      <p className="font-display text-3xl text-oxblood">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65">{label}</p>
      <p className={`mt-0.5 text-[11px] font-medium ${up === undefined ? "text-ink/55" : up ? "text-emerald-700" : "text-rose-700"}`}>{sub}</p>
    </div>
  );
}
