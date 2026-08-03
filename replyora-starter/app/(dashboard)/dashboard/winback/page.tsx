import Link from "next/link";
import { CalendarCheck, Clock, DollarSign, Sparkles, Users } from "lucide-react";

import {
  getWinbackCustomers,
  getWinbackStats,
  weeksOverdue,
  type Vertical,
} from "@/lib/data/winback";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  WinbackQueue,
  type WinbackRow,
} from "@/components/dashboard/winback-queue";

const VERTICALS: { key: Vertical; label: string }[] = [
  { key: "physio", label: "Physio" },
  { key: "salon", label: "Salon" },
  { key: "gym", label: "Gym" },
];

function money(n: number): string {
  return `$${n.toLocaleString("en-AU")}`;
}

export default async function WinbackPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const vertical = VERTICALS.some((x) => x.key === v)
    ? (v as Vertical)
    : undefined;

  const [customers, stats] = await Promise.all([
    getWinbackCustomers(vertical),
    getWinbackStats(vertical),
  ]);

  const rows: WinbackRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    business: c.business,
    lastService: c.lastService,
    lastVisit: c.lastVisit,
    weeksOverdue: weeksOverdue(c),
    avgSpend: c.avgSpend,
    status: c.status,
    draft: c.draft,
  }));

  return (
    <div>
      <PageHeader
        title="Win-Back Agent"
        description="Finds customers who are overdue to come back, drafts an on-brand message for each, and books them in — you just approve."
      />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* ROI band */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Overdue customers"
            value={stats.overdue}
            hint="detected & drafted"
            icon={Users}
          />
          <StatCard
            label="Revenue in queue"
            value={money(stats.queuedValue)}
            hint={`~${money(stats.projectedRecovery)} at a 30% return`}
            icon={DollarSign}
          />
          <StatCard
            label="Messages sent"
            value={stats.sentThisRound}
            hint="awaiting reply"
            icon={Clock}
          />
          <StatCard
            label="Recovered"
            value={money(stats.revenueRecovered)}
            hint={`${stats.rebooked} rebooked`}
            icon={CalendarCheck}
          />
        </div>

        {/* How it works strip */}
        <div className="flex items-start gap-3 rounded-xl border border-oxblood/15 bg-oxblood/5 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-oxblood" />
          <p className="text-sm text-ink/80">
            The agent sweeps your customer list each day, flags anyone past their
            usual visit cycle, and writes a message in your voice. Approve, tweak,
            or snooze — nothing sends without you.
          </p>
        </div>

        {/* Vertical filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Demo business:
          </span>
          <Link
            href="/dashboard/winback"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !vertical
                ? "bg-ink text-white"
                : "bg-oat/50 text-muted-foreground hover:bg-oat"
            }`}
          >
            All
          </Link>
          {VERTICALS.map((x) => (
            <Link
              key={x.key}
              href={`/dashboard/winback?v=${x.key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                vertical === x.key
                  ? "bg-ink text-white"
                  : "bg-oat/50 text-muted-foreground hover:bg-oat"
              }`}
            >
              {x.label}
            </Link>
          ))}
        </div>

        <WinbackQueue rows={rows} />
      </div>
    </div>
  );
}
