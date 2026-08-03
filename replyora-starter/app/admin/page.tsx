import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

import {
  getAttentionQueue,
  getPlatformKpis,
  getRevenue,
  type AttentionSeverity,
} from "@/lib/admin/data";

const SEV: Record<AttentionSeverity, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-border bg-white text-ink/70",
};

function money(n: number): string {
  return `$${n.toLocaleString("en-AU")}`;
}

export default async function AdminHome() {
  const [kpis, attention, revenue] = await Promise.all([
    getPlatformKpis(),
    getAttentionQueue(),
    getRevenue(),
  ]);

  const tiles: { label: string; value: string; sub?: string }[] = [
    { label: "Clients", value: String(kpis.totalClients), sub: `${kpis.active} active · ${kpis.trialing} trial · ${kpis.pastDue} past-due` },
    { label: "MRR", value: money(kpis.mrr), sub: `ARR ${money(kpis.arr)}` },
    { label: "Signups this week", value: String(kpis.signupsThisWeek) },
    { label: "Trials ending ≤3d", value: String(kpis.trialsEndingSoon) },
    { label: "Messages (total)", value: kpis.totalMessages.toLocaleString() },
    { label: "Est. AI cost", value: money(kpis.estAiCostAud), sub: "this period" },
    { label: "KB pages (total)", value: kpis.totalKbPages.toLocaleString() },
    { label: "Churn (mo)", value: String(kpis.churnThisMonth) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Command center</h1>
        <p className="mt-1 text-sm text-ink/60">
          Platform health across every client.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-ink/50">
              {t.label}
            </p>
            <p className="mt-1 font-display text-2xl text-ink">{t.value}</p>
            {t.sub && <p className="mt-0.5 text-xs text-ink/50">{t.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention queue */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-ink">Attention queue</h2>
            <span className="text-xs text-ink/50">
              {attention.length} item{attention.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-2">
            {attention.length === 0 && (
              <p className="rounded-lg border border-border bg-white p-4 text-sm text-ink/60">
                All clear — nothing needs attention.
              </p>
            )}
            {attention.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm transition-opacity hover:opacity-90 ${SEV[a.severity]}`}
              >
                <span className="flex items-center gap-2">
                  <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {a.kind}
                  </span>
                  {a.label}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" />
              </Link>
            ))}
          </div>
        </div>

        {/* Revenue by plan */}
        <div>
          <h2 className="mb-3 font-semibold text-ink">Revenue by plan</h2>
          <div className="space-y-2 rounded-xl border border-border bg-white p-4">
            {revenue.byPlan.map((p) => (
              <div key={p.plan} className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink/70">{p.plan}</span>
                <span className="text-ink/60">
                  {p.count} · {money(p.mrr)}/mo
                </span>
              </div>
            ))}
            <div className="mt-2 border-t border-border pt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink/70">MRR</span>
                <span className="font-semibold text-ink">{money(revenue.mrr)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/70">Trial→paid</span>
                <span className="text-ink/60">{revenue.trialToPaid}%</span>
              </div>
            </div>
            <Link
              href="/admin/billing"
              className="mt-2 inline-flex items-center gap-1 text-xs text-ink/60 hover:text-oxblood"
            >
              Full revenue view <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
