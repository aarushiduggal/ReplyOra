"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import type { AdminOverviewData } from "@/lib/admin/overview";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

export function RevenueBoard({ data }: { data: AdminOverviewData }) {
  const { kpis, revenue, agencies } = data;

  const pastDueMrr = agencies
    .filter((a) => a.status === "past_due")
    .reduce((s, a) => s + a.mrr, 0);
  const trialPipeline = agencies
    .filter((a) => a.status === "trialing")
    .reduce((s, a) => s + a.mrr, 0);
  const arpa = kpis.activeAgencies
    ? Math.round(kpis.mrr / kpis.activeAgencies)
    : 0;
  const addonMrr = revenue
    .filter((r) => r.key === "chatbox" || r.key === "reports")
    .reduce((s, r) => s + r.mrr, 0);

  const paying = agencies
    .filter((a) => a.status === "active" || a.status === "past_due")
    .sort((a, b) => b.mrr - a.mrr);
  const maxLine = Math.max(1, ...revenue.map((r) => r.mrr));

  const tiles = [
    { icon: CreditCard, label: "MRR", value: money(kpis.mrr), sub: "monthly recurring" },
    { icon: TrendingUp, label: "ARR", value: money(kpis.arr), sub: "annualised" },
    { icon: Wallet, label: "ARPA", value: money(arpa), sub: "per active agency" },
    { icon: Users, label: "Paying", value: String(kpis.activeAgencies + kpis.pastDue), sub: `${kpis.activeAgencies} active · ${kpis.pastDue} past-due` },
    { icon: CalendarClock, label: "Trial pipeline", value: money(trialPipeline), sub: `${kpis.trialing} trials converting` },
    { icon: AlertTriangle, label: "At risk", value: money(pastDueMrr), sub: "past-due MRR" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-oxblood/70">Revenue</p>
        <h1 className="mt-1 font-display text-3xl text-ink">The money view</h1>
        <p className="mt-1 text-sm text-ink/60">
          MRR, what it&apos;s made of, and what&apos;s at risk — across every agency.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-oxblood/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">{t.label}</p>
              <t.icon className="h-3.5 w-3.5 text-oxblood/60" />
            </div>
            <p className="mt-1.5 font-display text-2xl text-oxblood">{t.value}</p>
            <p className="mt-0.5 text-[11px] text-ink/50">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* MRR breakdown with bars */}
        <div className="lg:col-span-3 rounded-2xl border border-oxblood/10 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
            Where MRR comes from
          </h2>
          <div className="mt-4 space-y-3">
            {revenue.map((r) => (
              <div key={r.key} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-ink/75">{r.label}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-oat">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-oxblood to-rose"
                    style={{ width: `${(r.mrr / maxLine) * 100}%` }}
                  />
                </span>
                <span className="w-16 text-right text-sm text-ink/70">{r.count}×</span>
                <span className="w-20 text-right text-sm font-semibold text-ink">{money(r.mrr)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-oxblood/10 pt-3 text-sm">
            <span className="text-ink/70">Add-on MRR (upsell)</span>
            <span className="font-semibold text-ink">{money(addonMrr)}</span>
          </div>
        </div>

        {/* Plan mix */}
        <div className="lg:col-span-2 rounded-2xl border border-oxblood/10 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Plan mix</h2>
          <div className="mt-4 space-y-3 text-sm">
            <MixRow label="Agency" count={paying.filter((a) => a.accountType === "agency").length} total={paying.length} />
            <MixRow label="Personal" count={paying.filter((a) => a.accountType === "personal").length} total={paying.length} />
          </div>
          <div className="mt-4 space-y-1.5 border-t border-oxblood/10 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Chatbox attach</span><span className="text-ink/80">{revenue.find((r) => r.key === "chatbox")?.count ?? 0} agencies</span></div>
            <div className="flex justify-between"><span className="text-ink/60">Reports attach</span><span className="text-ink/80">{revenue.find((r) => r.key === "reports")?.count ?? 0} agencies</span></div>
          </div>
        </div>
      </div>

      {/* Top agencies by revenue */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
          Agencies by revenue
        </h2>
        <div className="overflow-hidden rounded-2xl border border-oxblood/10 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-oxblood/10 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                <th className="px-4 py-2.5">Agency</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">MRR</th>
              </tr>
            </thead>
            <tbody>
              {paying.map((a) => (
                <tr key={a.id} className="border-b border-oxblood/5 last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/workspaces/${a.id}`} className="font-semibold text-ink hover:text-oxblood">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 capitalize text-ink/75">{a.accountType}</td>
                  <td className="px-3 py-2.5 text-ink/75">{a.status === "past_due" ? "past due" : a.status}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(a.mrr)}</td>
                </tr>
              ))}
              {paying.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[12px] text-ink/60">No paying agencies yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MixRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-ink/75">{label}</span>
        <span className="text-ink/60">{count} · {pct}%</span>
      </div>
      <span className="block h-2 overflow-hidden rounded-full bg-oat">
        <span className="block h-full rounded-full bg-oxblood" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
