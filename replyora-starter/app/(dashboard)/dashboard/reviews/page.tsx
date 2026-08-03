import { getWorkspace } from "@/lib/data/workspace";
import { getReviewRequests } from "@/lib/data/growth";
import { hasFeature } from "@/lib/usage";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { GrowthActionList, type GrowthRow } from "@/components/dashboard/growth-list";

export default async function ReviewsPage() {
  const [workspace, reviews] = await Promise.all([
    getWorkspace(),
    getReviewRequests(),
  ]);
  const can = hasFeature(workspace.plan, "reviewEngine");

  const rows: GrowthRow[] = reviews.map((r) => ({
    id: r.id,
    title: r.customer,
    subtitle: `${r.service} · completed ${relativeTime(r.completedAt)}`,
    meta: r.status === "clicked" ? "★ left a review" : undefined,
    done: r.status !== "pending",
    doneLabel: r.status === "clicked" ? "Review left" : "Requested",
  }));

  return (
    <div>
      <PageHeader
        title="Reviews & reputation"
        description="After a booking or a happy chat, ask the customer for a Google review — automatically."
      />
      <div className="mx-auto max-w-4xl p-6">
        {can ? (
          <GrowthActionList
            kind="review"
            path="/dashboard/reviews"
            actionLabel="Request review"
            emptyLabel="No completed appointments waiting for a review request."
            rows={rows}
          />
        ) : (
          <UpgradeGate
            flag="reviewEngine"
            description="Automatically ask happy customers for a Google review after their appointment — turning great service into more 5-star reviews."
          />
        )}
      </div>
    </div>
  );
}
