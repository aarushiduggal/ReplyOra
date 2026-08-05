"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  Layers,
  LogIn,
  MoonStar,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { enterAsAction } from "@/app/admin/actions";
import type {
  AdminOverviewData,
  AgencySummary,
  AttentionKind,
  AttentionSeverity,
} from "@/lib/admin/overview";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

const SEV: Record<AttentionSeverity, string> = {
  high: "border-rose-300/60 bg-rose-50 text-rose-800",
  medium: "border-amber-300/60 bg-amber-50 text-amber-800",
  low: "border-oxblood/15 bg-white text-ink/70",
};
const KIND_ICON: Record<AttentionKind, typeof AlertTriangle> = {
  trial: CalendarClock,
  billing: CreditCard,
  limit: Layers,
  inactive: MoonStar,
};

const STATUS_PILL: Record<AgencySummary["status"], string> = {
  active: "bg-emerald-100 text-emerald-800",
  trialing: "bg-amber-100 text-amber-800",
  past_due: "bg-rose-100 text-rose-800",
  canceled: "bg-ink/10 text-ink/60",
};

type Sort = "mrr" | "brands" | "posts" | "created" | "name";

export function CommandCenter({ data }: { data: AdminOverviewData }) {
  const { kpis, attention, revenue, agencies } = data;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("mrr");
  const [, start] = useTransition();

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const filtered = agencies.filter(
      (a) =>
        !n ||
        a.name.toLowerCase().includes(n) ||
        a.ownerEmail.toLowerCase().includes(n) ||
        a.ownerName.toLowerCase().includes(n),
    );
    return [...filtered].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "brands"
          ? b.brands - a.brands
          : sort === "posts"
            ? b.postsThisMonth - a.postsThisMonth
            : sort === "created"
              ? b.createdAt.localeCompare(a.createdAt)
              : b.mrr - a.mrr,
    );
  }, [agencies, q, sort]);

  const tiles = [
    { icon: Building2, label: "Agencies", value: String(kpis.agencies), sub: `${kpis.activeAgencies} active · ${kpis.trialing} trial · ${kpis.pastDue} past-due` },
    { icon: CreditCard, label: "MRR", value: money(kpis.mrr), sub: `ARR ${money(kpis.arr)}` },
    { icon: Users, label: "Brands managed", value: String(kpis.brands), sub: "across all agencies" },
    { icon: Sparkles, label: "Posts this month", value: kpis.postsThisMonth.toLocaleString(), sub: "scheduled + published" },
    { icon: ArrowUpRight, label: "New this week", value: String(kpis.newThisWeek), sub: "signups" },
    { icon: CalendarClock, label: "Trials", value: String(kpis.trialing), sub: "converting soon" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-oxblood/70">
          Command center
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          Everything, in one place
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Every agency, every brand, revenue and what needs you — live.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-oxblood/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">
                {t.label}
              </p>
              <t.icon className="h-3.5 w-3.5 text-oxblood/60" />
            </div>
            <p className="mt-1.5 font-display text-2xl text-oxblood">{t.value}</p>
            <p className="mt-0.5 text-[11px] text-ink/50">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention queue */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-ink">Needs attention</h2>
            <span className="text-xs text-ink/50">{attention.length} item{attention.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-2">
            {attention.length === 0 && (
              <p className="rounded-xl border border-oxblood/10 bg-white p-4 text-sm text-ink/60">
                All clear — nothing needs you right now.
              </p>
            )}
            {attention.map((a) => {
              const Icon = KIND_ICON[a.kind];
              return (
                <Link
                  key={a.id}
                  href={a.href}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm transition-opacity hover:opacity-90 ${SEV[a.severity]}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    {a.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Revenue */}
        <div>
          <h2 className="mb-3 font-semibold text-ink">Revenue</h2>
          <div className="space-y-2 rounded-2xl border border-oxblood/10 bg-white p-4">
            {revenue.map((r) => (
              <div key={r.key} className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{r.label}</span>
                <span className="text-ink/60">{r.count} · {money(r.mrr)}/mo</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-oxblood/10 pt-2">
              <span className="text-sm text-ink/70">Total MRR</span>
              <span className="font-display text-lg text-oxblood">{money(kpis.mrr)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agencies table */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">All agencies</h2>
          <div className="flex items-center gap-2">
            <span className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search agency or owner…"
                className="w-60 rounded-lg border border-ink/20 bg-white py-1.5 pl-8 pr-3 text-sm text-ink outline-none focus:border-oxblood"
              />
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-ink/20 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-oxblood"
            >
              <option value="mrr">Top MRR</option>
              <option value="brands">Most brands</option>
              <option value="posts">Most posts</option>
              <option value="created">Newest</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-oxblood/10 bg-white">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-oxblood/10 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                <th className="px-4 py-2.5">Agency</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Brands</th>
                <th className="px-3 py-2.5 text-right">Posts/mo</th>
                <th className="px-3 py-2.5 text-right">MRR</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-oxblood/5 last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/workspaces/${a.id}`} className="font-semibold text-ink hover:text-oxblood">
                      {a.name}
                    </Link>
                    <div className="text-[11px] text-ink/55">{a.ownerName} · {a.ownerEmail}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="capitalize text-ink/80">{a.accountType}</span>
                    <div className="mt-0.5 flex gap-1">
                      {a.addons.chatbox && <AddonTag label="chatbox" />}
                      {a.addons.reports && <AddonTag label="reports" />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[a.status]}`}>
                      {a.status === "past_due" ? "past due" : a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink/80">{a.brands}</td>
                  <td className="px-3 py-2.5 text-right text-ink/80">{a.postsThisMonth}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(a.mrr)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/workspaces/${a.id}`}
                        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60 hover:text-oxblood"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => start(() => enterAsAction(a.id))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
                      >
                        <LogIn className="h-3 w-3" /> Enter as
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-ink/60">
                    No agencies match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddonTag({ label }: { label: string }) {
  return (
    <span className="rounded bg-oxblood/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-oxblood">
      {label}
    </span>
  );
}
