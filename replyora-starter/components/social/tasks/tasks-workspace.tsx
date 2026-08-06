"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import type { AgencyTask, TaskStatus } from "@/lib/social/tasks";
import {
  createTaskAction,
  deleteTaskAction,
  moveTaskAction,
  updateTaskAction,
} from "@/app/(social)/tasks/actions";
import { GuideTrigger } from "@/components/social/guide";

export function TasksWorkspace({ tasks }: { tasks: AgencyTask[] }) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [, startTransition] = useTransition();

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  function drop(status: TaskStatus) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    startTransition(async () => {
      await moveTaskAction(id, status);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 02 )</span> To-Do
          <GuideTrigger pageKey="tasks" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
          {todo.length} open <span className="text-ink/30">|</span> {inProgress.length} in progress{" "}
          <span className="text-ink/30">|</span> {done.length} completed
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80">
          Sort by: Due date
        </span>
      </div>

      {tasks.length === 0 && (
        <p className="mb-6 rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-medium text-ink/80">
          Nothing to do — add your first task below.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Column
          title="To do"
          status="todo"
          tasks={todo}
          onDropHere={() => drop("todo")}
          onDragStart={setDragId}
          onRefresh={() => router.refresh()}
        />
        <Column
          title="In progress"
          status="in_progress"
          tasks={inProgress}
          onDropHere={() => drop("in_progress")}
          onDragStart={setDragId}
          onRefresh={() => router.refresh()}
        />
      </div>

      {/* Completed */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setCompletedOpen((o) => !o)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop("done")}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85"
        >
          {completedOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Completed ({done.length})
        </button>
        {completedOpen && (
          <div className="mt-3 space-y-2">
            {done.length === 0 ? (
              <p className="text-[11px] text-ink/75">Nothing completed yet.</p>
            ) : (
              done.map((t) => (
                <TaskCard key={t.id} task={t} onDragStart={setDragId} onRefresh={() => router.refresh()} muted />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({
  title,
  status,
  tasks,
  onDropHere,
  onDragStart,
  onRefresh,
}: {
  title: string;
  status: TaskStatus;
  tasks: AgencyTask[];
  onDropHere: () => void;
  onDragStart: (id: string) => void;
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title2, setTitle2] = useState("");
  const [due, setDue] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!title2.trim()) return;
    const t = title2;
    const d = due;
    setTitle2("");
    setDue("");
    setAdding(false);
    startTransition(async () => {
      await createTaskAction({
        title: t,
        status,
        dueAt: d ? new Date(d).toISOString() : null,
      });
      onRefresh();
    });
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropHere}
      className="rounded-2xl border border-ink/10 bg-ink/[0.01] p-3"
    >
      <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
        {title} ({tasks.length})
      </p>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onDragStart={onDragStart} onRefresh={onRefresh} />
        ))}
      </div>

      {adding ? (
        <div className="mt-2 space-y-2 rounded-xl border border-oxblood/20 bg-white p-2">
          <input
            autoFocus
            value={title2}
            onChange={(e) => setTitle2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Task title"
            className="w-full rounded border border-ink/15 px-2 py-1.5 text-sm outline-none focus:border-oxblood"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full rounded border border-ink/15 px-2 py-1.5 text-[12px] outline-none focus:border-oxblood"
          />
          <div className="flex gap-2">
            <button type="button" onClick={add} className="rounded-full bg-oxblood px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:text-oxblood"
        >
          <Plus className="h-3.5 w-3.5" /> Add task
        </button>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
  onRefresh,
  muted,
}: {
  task: AgencyTask;
  onDragStart: (id: string) => void;
  onRefresh: () => void;
  muted?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [due, setDue] = useState(task.dueAt ? task.dueAt.slice(0, 10) : "");
  const done = task.status === "done";

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      onRefresh();
    });
  }

  function saveEdit() {
    setEditing(false);
    run(() =>
      updateTaskAction(task.id, {
        title: title.trim() || task.title,
        dueAt: due ? new Date(due).toISOString() : null,
      }),
    );
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-xl border border-oxblood/25 bg-white p-2.5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          className="w-full rounded border border-ink/15 px-2 py-1.5 text-sm outline-none focus:border-oxblood"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full rounded border border-ink/15 px-2 py-1.5 text-[12px] outline-none focus:border-oxblood"
        />
        <div className="flex gap-2">
          <button type="button" onClick={saveEdit} className="rounded-full bg-oxblood px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream">Save</button>
          <button type="button" onClick={() => { setEditing(false); setTitle(task.title); setDue(task.dueAt ? task.dueAt.slice(0, 10) : ""); }} className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className={`group flex items-start gap-2 rounded-xl border border-ink/10 bg-white p-2.5 ${muted ? "opacity-60" : ""}`}
    >
      {/* Complete toggle */}
      <button
        type="button"
        onClick={() => run(() => moveTaskAction(task.id, done ? "todo" : "done"))}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink/30 text-transparent hover:border-oxblood"}`}
        aria-label={done ? "Mark as to do" : "Mark complete"}
      >
        <Check className="h-3 w-3" />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium text-ink ${done ? "line-through" : ""}`}>{task.title}</p>
        {task.dueAt && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/75">
            Due {task.dueAt.slice(0, 10)}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {done && (
          <button
            type="button"
            onClick={() => run(() => moveTaskAction(task.id, "todo"))}
            className="text-ink/35 hover:text-oxblood"
            aria-label="Reopen task"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink/35 hover:text-oxblood"
          aria-label="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => run(() => deleteTaskAction(task.id))}
          className="text-ink/35 hover:text-rose"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
