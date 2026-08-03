import { getWorkspace } from "@/lib/data/workspace";
import { getAbandonedEnquiries } from "@/lib/data/growth";
import { hasFeature } from "@/lib/usage";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { GrowthActionList, type GrowthRow } from "@/components/dashboard/growth-list";

export default async function RecoveryPage() {
  const [workspace, enquiries] = await Promise.all([
    getWorkspace(),
    getAbandonedEnquiries(),
  ]);
  const can = hasFeature(workspace.plan, "abandonedRecovery");

  const rows: GrowthRow[] = enquiries.map((e) => ({
    id: e.id,
    title: e.lastMessage,
    subtitle: `${e.stage === "booking" ? "Abandoned booking" : "Dropped chat"} · ${relativeTime(e.droppedAt)}`,
    done: e.status !== "pending",
    doneLabel: "Follow-up sent",
  }));

  return (
    <div>
      <PageHeader
        title="Abandoned recovery"
        description="Visitors who started a chat or booking and dropped off — nudge them to finish."
      />
      <div className="mx-auto max-w-4xl p-6">
        {can ? (
          <GrowthActionList
            kind="abandoned"
            path="/dashboard/recovery"
            actionLabel="Send follow-up"
            emptyLabel="No abandoned enquiries right now."
            rows={rows}
          />
        ) : (
          <UpgradeGate
            flag="abandonedRecovery"
            description="When a visitor starts a chat or booking and drops off, your assistant emails them to finish — recovering enquiries that would have gone cold."
          />
        )}
      </div>
    </div>
  );
}
