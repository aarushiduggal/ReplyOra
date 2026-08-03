import { UsersRound } from "lucide-react";

import { listLeads } from "@/lib/data/leads";
import { getWinbackLeads } from "@/lib/data/growth";
import { getWorkspace } from "@/lib/data/workspace";
import { hasFeature } from "@/lib/usage";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { GrowthActionList, type GrowthRow } from "@/components/dashboard/growth-list";
import type { LeadStatus } from "@/lib/data/types";

const VALID_STATUS: LeadStatus[] = ["new", "qualified", "booked", "lost"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; empty?: string }>;
}) {
  const sp = await searchParams;
  const empty = sp.empty === "1";
  const [leads, workspace, winback] = await Promise.all([
    empty ? Promise.resolve([]) : listLeads(),
    getWorkspace(),
    getWinbackLeads(),
  ]);
  const initialFilter =
    sp.status && VALID_STATUS.includes(sp.status as LeadStatus)
      ? (sp.status as LeadStatus)
      : "all";

  const canWinback = hasFeature(workspace.plan, "leadWinBack");
  const winbackRows: GrowthRow[] = winback.map((w) => ({
    id: w.id,
    title: w.name,
    subtitle: `${w.intent} · last seen ${relativeTime(w.lastSeen)}`,
    done: w.status !== "pending",
    doneLabel: "Win-back sent",
  }));

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Contacts your assistant captured. Move them through new → qualified → booked."
      />
      <div className="space-y-10 p-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No leads yet"
            description="When a visitor shares their details, they'll appear here ready to qualify and book. Install your widget to start capturing."
            actionLabel="Get your install snippet"
            actionHref="/dashboard/install"
          />
        ) : (
          <LeadsTable initialLeads={leads} initialFilter={initialFilter} />
        )}

        {/* AI lead win-back (Pro) */}
        <div>
          <h2 className="mb-1 font-display text-xl text-oxblood">
            AI lead win-back
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Leads that went cold without booking — nudge them back automatically.
          </p>
          {canWinback ? (
            <GrowthActionList
              kind="winback"
              path="/dashboard/leads"
              actionLabel="Send win-back"
              emptyLabel="No cold leads to win back right now."
              rows={winbackRows}
            />
          ) : (
            <UpgradeGate
              flag="leadWinBack"
              description="Automatically follow up leads that didn't book (“still interested?”) on a schedule, recovering enquiries that would otherwise be lost."
            />
          )}
        </div>
      </div>
    </div>
  );
}
