"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { animate } from "framer-motion";
import { Instagram, Printer, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import type { ClientPost } from "@/lib/social/posts";
import type { InsightsSummary } from "@/lib/social/instagram-insights";
import { PLATFORM_LABEL } from "@/lib/social/types";
import { GuideTrigger } from "@/components/social/guide";

/** Compact number: 8800 → "8.8K". */
function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ------------------------------- helpers --------------------------------- */

function dayKey(p: ClientPost): string {
  return (p.scheduledFor ?? p.createdAt).slice(0, 10);
}

/** Count-up number (settles on its target even when off-screen). */
function Counter({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, {
      duration: 0.9,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => c.stop();
  }, [to]);
  return <>{v.toLocaleString("en-AU")}</>;
}

/** Bucket posts into ~8 even columns across the range for the cadence chart. */
function cadenceBuckets(posts: ClientPost[], from: string, to: string) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  const span = Math.max(1, end - start);
  const N = 8;
  const buckets = Array.from({ length: N }, () => 0);
  for (const p of posts) {
    const t = new Date(dayKey(p)).getTime();
    if (t < start || t > end) continue;
    const idx = Math.min(N - 1, Math.floor(((t - start) / span) * N));
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  }
  return buckets;
}

/** Plain-English "what changed" paragraph, generated from the real numbers. */
function buildInsight(
  clientName: string,
  count: number,
  prev: number,
  days: number,
  topPillar: [string, number] | undefined,
  published: number,
  firstHalf: number,
  secondHalf: number,
): string {
  if (count === 0) {
    return `No posts went out for ${clientName} in this window. Schedule a few from the Studio to start building momentum.`;
  }
  const delta = count - prev;
  const dir =
    delta > 0 ? `up ${delta}` : delta < 0 ? `down ${Math.abs(delta)}` : "flat";
  const share = topPillar ? Math.round((topPillar[1] / count) * 100) : 0;
  const trend =
    secondHalf > firstHalf
      ? "Cadence picked up through the period — the back half was busier than the start."
      : secondHalf < firstHalf
        ? "Cadence eased off toward the end — worth topping up the schedule to hold rhythm."
        : "Cadence held steady across the period.";
  const pillarLine = topPillar
    ? ` ${topPillar[0]} led the mix at ${share}% of posts.`
    : "";
  const pubLine =
    published > 0 ? ` ${published} of them are already published.` : "";
  return (
    `Over the last ${days} days, ${clientName} posted ${count} times — ${dir} vs the previous ${days} days.` +
    pillarLine +
    pubLine +
    ` ${trend} Keep leaning into what's landing and hold the cadence.`
  );
}

/* ------------------------------ component -------------------------------- */

export function ReportsWorkspace({
  clientId,
  clientName,
  connected,
  posts,
  insights,
  reportTitle,
  todayISO,
}: {
  clientId: string;
  clientName: string;
  connected: boolean;
  posts: ClientPost[];
  insights: InsightsSummary | null;
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

  const inRange = useMemo(
    () =>
      posts.filter((p) => {
        const d = dayKey(p);
        return d >= range.from && d <= range.to;
      }),
    [posts, range],
  );

  const days = useMemo(
    () =>
      Math.max(
        1,
        Math.round(
          (new Date(range.to).getTime() - new Date(range.from).getTime()) /
            86400000,
        ),
      ),
    [range],
  );

  const prevWindow = useMemo(() => {
    const prevTo = new Date(range.from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - days);
    const pf = prevFrom.toISOString().slice(0, 10);
    const pt = prevTo.toISOString().slice(0, 10);
    return posts.filter((p) => {
      const d = dayKey(p);
      return d >= pf && d <= pt;
    }).length;
  }, [posts, range, days]);

  const pillars = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of inRange) {
      const k = p.pillar || "Other";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [inRange]);
  const maxPillar = pillars[0]?.[1] ?? 1;

  const published = useMemo(
    () => inRange.filter((p) => p.status === "published").length,
    [inRange],
  );
  const perWeek = Math.round((inRange.length / days) * 7 * 10) / 10;
  const delta = inRange.length - prevWindow;

  const buckets = useMemo(
    () => cadenceBuckets(inRange, range.from, range.to),
    [inRange, range],
  );
  const half = Math.floor(buckets.length / 2);
  const firstHalf = buckets.slice(0, half).reduce((a, b) => a + b, 0);
  const secondHalf = buckets.slice(half).reduce((a, b) => a + b, 0);

  const autoInsight = useMemo(
    () =>
      buildInsight(
        clientName,
        inRange.length,
        prevWindow,
        days,
        pillars[0],
        published,
        firstHalf,
        secondHalf,
      ),
    [clientName, inRange.length, prevWindow, days, pillars, published, firstHalf, secondHalf],
  );

  const TABS = ["Overview", "Comparison", "Top posts", "Pillars", "Formats", "Planning", "All posts"] as const;
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  // Upcoming planned/scheduled posts (Planning tab) + all posts in range (All posts).
  const planned = useMemo(
    () => posts.filter((p) => p.status !== "published").sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? "")),
    [posts],
  );

  const [summary, setSummary] = useState(autoInsight);
  const [edited, setEdited] = useState(false);
  // Keep the summary in sync with the data until the user edits it by hand.
  useEffect(() => {
    if (!edited) setSummary(autoInsight);
  }, [autoInsight, edited]);

  return (
    <div>
      <Header title={reportTitle} clientId={clientId} />

      {insights && (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-oxblood">
            <Instagram className="h-3.5 w-3.5" /> Live from Instagram · last {insights.posts} posts
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <LiveStat label="Reach" value={compact(insights.reach)} />
            <LiveStat label="Engagements" value={compact(insights.engagements)} />
            <LiveStat label="Avg engagement rate" value={`${insights.avgEngagementRate.toFixed(1)}%`} />
            <LiveStat label="Saves" value={compact(insights.saves)} />
          </div>
        </div>
      )}

      {!insights && !connected && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-oxblood/20 bg-oxblood/5 px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-medium text-ink/80">
            <Instagram className="h-4 w-4 text-oxblood" />
            Reach & engagement populate once {clientName}&apos;s Instagram is
            connected. Activity below is live from your plan.
          </p>
          <Link
            href={`/clients/${clientId}/integrations`}
            className="rounded-full bg-oxblood px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 print:hidden"
          >
            Connect Instagram
          </Link>
        </div>
      )}

      {/* date range */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-oxblood/20 px-3 py-1.5 text-sm outline-none focus:border-oxblood" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">To</label>
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

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-b border-oxblood/10 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] print:hidden">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-1 transition-colors ${tab === t ? "border-b-2 border-oxblood text-oxblood" : "text-ink/50 hover:text-ink/80"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
      <>
      {/* stat cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Posts this period" value={inRange.length} delta={delta} />
        <Stat label="Published" value={published} sub="live on socials" />
        <Stat label="Avg / week" value={perWeek} sub="posting cadence" decimal />
        <Stat label="Pillars in play" value={pillars.length} sub="content themes" />
      </div>

      {/* cadence chart */}
      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          Posting cadence
        </p>
        <CadenceChart buckets={buckets} />
      </div>
      </>
      )}

      {tab === "Pillars" && (
      /* pillar breakdown */
      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Pillar breakdown</p>
        {pillars.length === 0 ? (
          <p className="mt-3 text-[12px] text-ink/80">No posts in this period.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pillars.map(([name, n]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[12px] font-medium text-ink/80">{name}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-oat">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-oxblood to-rose transition-[width] duration-700 ease-out"
                    style={{ width: `${(n / maxPillar) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right text-[11px] text-ink/80">{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {tab === "Overview" && (
      /* auto insight */
      <div className="mt-8 rounded-2xl border border-oxblood/15 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
            <Sparkles className="h-3.5 w-3.5" /> What changed this month
          </p>
          {edited && (
            <button
              type="button"
              onClick={() => {
                setEdited(false);
                setSummary(autoInsight);
              }}
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60 hover:text-oxblood print:hidden"
            >
              Regenerate
            </button>
          )}
        </div>
        <textarea
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setEdited(true);
          }}
          rows={4}
          className="mt-3 w-full resize-none rounded-xl border border-oxblood/15 bg-cream/40 px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-oxblood"
        />
        <p className="mt-2 text-[10px] text-ink/55 print:hidden">
          Auto-written from this period&apos;s data — edit any line before you send it.
        </p>
      </div>
      )}

      {tab === "Formats" && (
        insights && insights.perFormat.length > 0 ? (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
            Formats · which drove engagement
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[...insights.perFormat]
              .sort((a, b) => b.engagements / Math.max(1, b.posts) - a.engagements / Math.max(1, a.posts))
              .map((f) => (
                <div key={f.format} className="rounded-2xl border border-ink/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg text-ink">{f.format}</p>
                    <p className="text-[11px] text-ink/60">{f.posts} post{f.posts === 1 ? "" : "s"}</p>
                  </div>
                  <p className="mt-2 font-display text-2xl text-oxblood">
                    {Math.round(f.engagements / Math.max(1, f.posts))}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55">
                    avg engagements · {compact(f.reach)} reach
                  </p>
                </div>
              ))}
          </div>
        </div>
        ) : (
          <p className="mt-6 text-[12px] text-ink/80">Format data appears once Instagram is connected and has posts.</p>
        )
      )}

      {tab === "Top posts" && (
      /* top posts — real (by engagement) when connected, else planned */
      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Top posts</p>
        <div className="mt-3 space-y-2">
          {insights && insights.topPosts.length > 0 ? (
            insights.topPosts.map((p) => (
              <a
                key={p.id}
                href={p.permalink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-4 py-2.5 hover:border-oxblood/30"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {p.mediaUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.mediaUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                  )}
                  <span className="truncate text-[13px] text-ink">{p.caption?.slice(0, 60) || p.format}</span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood">
                  {compact(p.engagements)} eng · {compact(p.reach)} reach
                </span>
              </a>
            ))
          ) : (() => {
            const ranked = inRange.filter((p) => p.caption?.trim()).slice(0, 5);
            return ranked.length > 0 ? (
              ranked.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-2.5">
                  <span className="text-[13px] text-ink">{p.caption.slice(0, 60)}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ink/75">
                    {p.scheduledFor?.slice(0, 10)} · {PLATFORM_LABEL[p.platform]}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-ink/80">No posts to rank yet.</p>
            );
          })()}
        </div>
      </div>
      )}

      {tab === "Comparison" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <CompareCard label="Posts" now={inRange.length} prev={prevWindow} />
          {insights ? (
            <>
              <CompareCard label="Reach" now={insights.reach} prev={0} compactNum />
              <CompareCard label="Engagements" now={insights.engagements} prev={0} compactNum />
              <CompareCard label="Saves" now={insights.saves} prev={0} compactNum />
            </>
          ) : (
            <p className="text-[12px] text-ink/70">Connect Instagram for reach &amp; engagement comparison.</p>
          )}
        </div>
      )}

      {tab === "Planning" && (
        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Upcoming &amp; planned</p>
          {planned.length === 0 ? (
            <p className="text-[12px] text-ink/80">Nothing planned yet.</p>
          ) : (
            planned.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-2.5">
                <span className="truncate text-[13px] text-ink">{p.caption?.slice(0, 60) || "(untitled)"}</span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink/75">{p.status} · {p.scheduledFor?.slice(0, 10) ?? "—"}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "All posts" && (
        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">All posts in range ({inRange.length})</p>
          {inRange.length === 0 ? (
            <p className="text-[12px] text-ink/80">No posts in this period.</p>
          ) : (
            inRange.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-2.5">
                <span className="truncate text-[13px] text-ink">{p.caption?.slice(0, 60) || "(untitled)"}</span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink/75">{p.pillar || "—"} · {PLATFORM_LABEL[p.platform]} · {p.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ sub-parts -------------------------------- */

function CompareCard({ label, now, prev, compactNum }: { label: string; now: number; prev: number; compactNum?: boolean }) {
  const fmt = (n: number) => (compactNum ? compact(n) : String(n));
  const delta = now - prev;
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <p className="mt-1 font-display text-2xl text-oxblood">{fmt(now)}</p>
      {prev > 0 ? (
        <p className={`text-[11px] font-medium ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {delta >= 0 ? "▲" : "▼"} vs {fmt(prev)} prior period
        </p>
      ) : (
        <p className="text-[11px] text-ink/55">this period</p>
      )}
    </div>
  );
}

function CadenceChart({ buckets }: { buckets: number[] }) {
  const max = Math.max(1, ...buckets);
  const w = 100;
  const h = 32;
  const step = buckets.length > 1 ? w / (buckets.length - 1) : w;
  const pts = buckets.map((b, i) => {
    const x = i * step;
    const y = h - (b / max) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;

  return (
    <div className="mt-3 rounded-2xl border border-oxblood/10 bg-white p-4">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full">
        <defs>
          <linearGradient id="cadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B26B62" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B26B62" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cadFill)" />
        <path
          d={line}
          fill="none"
          stroke="#5C1A1A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.1em] text-ink/45">
        <span>Start of period</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Header({ title, clientId }: { title: string; clientId: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
        <span className="text-oxblood">( 08 )</span> Reports
        <GuideTrigger pageKey="reports" clientId={clientId} />
      </div>
      <h2 className="mt-3 font-display text-3xl text-oxblood">{title}</h2>
    </div>
  );
}

/** Real-number stat (pre-formatted string, e.g. "8.8K") for live Instagram metrics. */
function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-oxblood/20 bg-oxblood/[0.03] px-4 py-3">
      <p className="font-display text-3xl text-oxblood">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">{label}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  delta,
  decimal,
}: {
  label: string;
  value: number;
  sub?: string;
  delta?: number;
  decimal?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 px-4 py-3">
      <p className="font-display text-3xl text-oxblood">
        {decimal ? value.toFixed(1) : <Counter to={value} />}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">{label}</p>
      {delta !== undefined ? (
        <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta >= 0 ? "+" : ""}{delta} vs previous
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] font-medium text-ink/75">{sub}</p>
      )}
    </div>
  );
}
