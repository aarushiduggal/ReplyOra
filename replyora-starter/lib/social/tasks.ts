import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

/**
 * ReplyOra Social — the agency's To-Do board (the `tasks` table). Workspace-
 * wide, optionally attached to a client. Statuses: todo | in_progress | done.
 */

export type TaskStatus = "todo" | "in_progress" | "done";

export interface AgencyTask {
  id: string;
  clientId: string | null;
  title: string;
  status: TaskStatus;
  dueAt: string | null;
  sortIndex: number;
}

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

function genId(): string {
  return "tk_" + Math.random().toString(36).slice(2, 10);
}

interface MemTask extends AgencyTask {
  workspaceId: string;
}
const MEM: MemTask[] = [];

interface Row {
  id: string;
  client_id: string | null;
  title: string;
  status: string;
  due_at: string | Date | null;
  sort_index: number | null;
}

function toTask(r: Row): AgencyTask {
  return {
    id: r.id,
    clientId: r.client_id,
    title: r.title,
    status: (r.status as TaskStatus) ?? "todo",
    dueAt: r.due_at ? new Date(r.due_at).toISOString() : null,
    sortIndex: r.sort_index ?? 0,
  };
}

export async function listTasks(): Promise<AgencyTask[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM.filter((t) => t.workspaceId === workspaceId).sort(
      (a, b) =>
        a.sortIndex - b.sortIndex ||
        (a.dueAt ?? "").localeCompare(b.dueAt ?? ""),
    );
  }
  const rows = (await sql()`
    SELECT id, client_id, title, status, due_at, sort_index
    FROM tasks WHERE workspace_id = ${workspaceId}
    ORDER BY sort_index ASC, due_at ASC NULLS LAST
  `) as Row[];
  return rows.map(toTask);
}

export async function createTask(input: {
  title: string;
  status?: TaskStatus;
  dueAt?: string | null;
  clientId?: string | null;
}): Promise<AgencyTask> {
  const workspaceId = await getCurrentWorkspaceId();
  const task: AgencyTask = {
    id: genId(),
    clientId: input.clientId ?? null,
    title: input.title.trim(),
    status: input.status ?? "todo",
    dueAt: input.dueAt ?? null,
    sortIndex: 0,
  };
  if (!hasDb()) {
    MEM.push({ ...task, workspaceId });
    return task;
  }
  await sql()`
    INSERT INTO tasks (id, workspace_id, client_id, title, status, due_at, sort_index)
    VALUES (${task.id}, ${workspaceId}, ${task.clientId}, ${task.title},
            ${task.status}, ${task.dueAt}, ${task.sortIndex})
  `;
  return task;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const t = MEM.find((x) => x.id === id && x.workspaceId === workspaceId);
    if (t) t.status = status;
    return;
  }
  await sql()`
    UPDATE tasks SET status = ${status}
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}

export async function deleteTask(id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const i = MEM.findIndex((x) => x.id === id && x.workspaceId === workspaceId);
    if (i >= 0) MEM.splice(i, 1);
    return;
  }
  await sql()`DELETE FROM tasks WHERE workspace_id = ${workspaceId} AND id = ${id}`;
}
