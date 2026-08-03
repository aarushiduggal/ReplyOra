import { getWorkspace } from "@/lib/data/workspace";
import { getUnansweredQuestions } from "@/lib/data/growth";
import { hasFeature } from "@/lib/usage";
import { PageHeader } from "@/components/dashboard/page-header";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { TrainingQueue, type GapRow } from "@/components/dashboard/training-queue";

export default async function TrainingPage() {
  const [workspace, gaps] = await Promise.all([
    getWorkspace(),
    getUnansweredQuestions(),
  ]);
  const can = hasFeature(workspace.plan, "continuousRetrain");

  const rows: GapRow[] = gaps.map((g) => ({
    id: g.id,
    question: g.question,
    count: g.count,
    resolved: g.resolved,
  }));

  return (
    <div>
      <PageHeader
        title="Continuous retraining"
        description="Questions your assistant couldn't answer. Answer once and it learns them forever."
      />
      <div className="mx-auto max-w-4xl p-6">
        {can ? (
          <TrainingQueue rows={rows} />
        ) : (
          <UpgradeGate
            flag="continuousRetrain"
            description="Your assistant flags every question it couldn't answer. Add the answer once and it's added to your knowledge base — a self-improving assistant."
          />
        )}
      </div>
    </div>
  );
}
