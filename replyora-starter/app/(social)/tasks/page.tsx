import { PageShell } from "@/components/social/page-shell";
import { TasksWorkspace } from "@/components/social/tasks/tasks-workspace";
import { listTasks } from "@/lib/social/tasks";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await listTasks();
  return (
    <PageShell>
      <TasksWorkspace tasks={tasks} />
    </PageShell>
  );
}
