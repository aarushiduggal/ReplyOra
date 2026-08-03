"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, PhoneCall } from "lucide-react";

import { adminLogCall, adminUpdateTicket } from "@/lib/admin/actions";
import { toast } from "@/lib/toast";
import type { CallStatus, TicketStatus } from "@/lib/admin/seed";

export interface OnboardingItem {
  clientId: string;
  clientName: string;
  tasks: { key: string; label: string; done: boolean }[];
}
export interface TicketItem {
  id: string;
  clientName: string;
  type: string;
  title: string;
  status: TicketStatus;
  feeAud: number | null;
}
export interface CallItem {
  id: string;
  clientName: string;
  cadenceDays: number;
  dueAt: string;
  status: CallStatus;
  notes: string;
}

const card = "rounded-xl border border-border bg-white p-5";
const chip =
  "rounded-full px-2 py-0.5 text-xs capitalize";

const TICKET_NEXT: Record<TicketStatus, TicketStatus | null> = {
  open: "in_progress",
  in_progress: "done",
  done: null,
};

export function ServiceBoard({
  onboarding,
  tickets,
  calls,
}: {
  onboarding: OnboardingItem[];
  tickets: TicketItem[];
  calls: CallItem[];
}) {
  const [pending, start] = useTransition();
  const [t, setT] = useState(tickets);
  const [c, setC] = useState(calls);

  function advanceTicket(id: string, status: TicketStatus) {
    const next = TICKET_NEXT[status];
    if (!next) return;
    start(async () => {
      await adminUpdateTicket(id, next);
      setT((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
      toast({ title: `Ticket → ${next.replace("_", " ")}`, type: "success" });
    });
  }

  function logCall(id: string, status: CallStatus) {
    start(async () => {
      await adminLogCall(id, status, "");
      setC((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      toast({ title: `Call ${status}`, type: "success" });
    });
  }

  return (
    <div className="space-y-8">
      {/* Onboarding pipeline */}
      <section>
        <h2 className="mb-3 font-semibold text-ink">Onboarding pipeline</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {onboarding.map((o) => {
            const done = o.tasks.filter((x) => x.done).length;
            return (
              <div key={o.clientId} className={card}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{o.clientName}</p>
                  <span className="text-xs text-ink/50">
                    {done}/{o.tasks.length} steps
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {o.tasks.map((task) => (
                    <li key={task.key} className="flex items-center gap-2 text-sm">
                      {task.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-ink/40" />
                      )}
                      <span className={task.done ? "text-ink/50 line-through" : "text-ink/70"}>
                        {task.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {onboarding.length === 0 && (
            <p className="text-sm text-ink/50">No clients in onboarding.</p>
          )}
        </div>
      </section>

      {/* Update / retrain queue */}
      <section>
        <h2 className="mb-3 font-semibold text-ink">Update / retrain queue</h2>
        <div className="space-y-2">
          {t.map((ticket) => (
            <div key={ticket.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <p className="text-sm text-ink">
                  <span className="text-ink/60">{ticket.clientName} — </span>
                  {ticket.title}
                </p>
                <p className="mt-0.5 text-xs text-ink/40">
                  {ticket.type.replace("_", " ")}
                  {ticket.feeAud ? ` · $${ticket.feeAud} billable` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`${chip} ${
                    ticket.status === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : ticket.status === "in_progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-oat text-ink/60"
                  }`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
                {TICKET_NEXT[ticket.status] && (
                  <button
                    disabled={pending}
                    onClick={() => advanceTicket(ticket.id, ticket.status)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink hover:bg-oat disabled:opacity-50"
                  >
                    Mark {TICKET_NEXT[ticket.status]!.replace("_", " ")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance-call scheduler */}
      <section>
        <h2 className="mb-3 font-semibold text-ink">Performance-call scheduler</h2>
        <div className="space-y-2">
          {c.map((call) => (
            <div key={call.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-ink/50" />
                <div>
                  <p className="text-sm text-ink">{call.clientName}</p>
                  <p className="text-xs text-ink/40">
                    Every {call.cadenceDays} days · due{" "}
                    {new Date(call.dueAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    {call.notes ? ` · ${call.notes}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`${chip} ${
                    call.status === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : call.status === "scheduled"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {call.status}
                </span>
                {call.status !== "done" && (
                  <>
                    {call.status === "due" && (
                      <button
                        disabled={pending}
                        onClick={() => logCall(call.id, "scheduled")}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink hover:bg-oat disabled:opacity-50"
                      >
                        Schedule
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() => logCall(call.id, "done")}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink hover:bg-oat disabled:opacity-50"
                    >
                      Log done
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
