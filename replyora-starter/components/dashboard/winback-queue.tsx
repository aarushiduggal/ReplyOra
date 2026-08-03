"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  Undo2,
} from "lucide-react";

import {
  approveWinback,
  markWinbackRebooked,
  reactivateWinback,
  regenerateWinback,
  snoozeWinback,
} from "@/lib/data/winback-actions";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface WinbackRow {
  id: string;
  name: string;
  phone: string;
  business: string;
  lastService: string;
  lastVisit: string;
  weeksOverdue: number;
  avgSpend: number;
  status: "overdue" | "sent" | "rebooked" | "snoozed";
  draft: string;
}

function money(n: number): string {
  return `$${n.toLocaleString("en-AU")}`;
}

const STATUS_PILL: Record<
  WinbackRow["status"],
  { label: string; className: string }
> = {
  overdue: { label: "Overdue", className: "bg-amber-100 text-amber-800" },
  sent: { label: "Message sent", className: "bg-sky-100 text-sky-700" },
  rebooked: { label: "Rebooked", className: "bg-emerald-100 text-emerald-700" },
  snoozed: { label: "Snoozed", className: "bg-slate-100 text-slate-600" },
};

function Row({ row }: { row: WinbackRow }) {
  const [status, setStatus] = useState(row.status);
  const [draft, setDraft] = useState(row.draft);
  const [pending, start] = useTransition();
  const [action, setAction] = useState<string | null>(null);

  const pill = STATUS_PILL[status];
  const overdueLabel = `${row.weeksOverdue} ${row.weeksOverdue === 1 ? "wk" : "wks"} overdue`;

  function run(name: string, fn: () => Promise<void>, done?: () => void) {
    setAction(name);
    start(async () => {
      await fn();
      done?.();
      setAction(null);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{row.name}</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.className}`}
              >
                {pill.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.lastService} · last in {formatDate(row.lastVisit)} ·{" "}
              <span className="font-medium text-amber-700">{overdueLabel}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg text-ink">{money(row.avgSpend)}</p>
            <p className="text-[11px] text-muted-foreground">per visit</p>
          </div>
        </div>

        {status === "overdue" ? (
          <>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run("approve", () => approveWinback(row.id, draft), () => {
                    setStatus("sent");
                    toast({ title: `Win-back sent to ${row.name}`, type: "success" });
                  })
                }
              >
                {pending && action === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Approve &amp; send
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run("regen", async () => {
                    const next = await regenerateWinback(row.id);
                    if (next) setDraft(next);
                  })
                }
              >
                {pending && action === "regen" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run("snooze", () => snoozeWinback(row.id), () => setStatus("snoozed"))
                }
              >
                {pending && action === "snooze" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Snooze
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-oat/40 p-3">
            <p className="text-sm text-ink/80">&ldquo;{draft}&rdquo;</p>
          </div>
        )}

        {status === "sent" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run("rebooked", () => markWinbackRebooked(row.id), () => {
                  setStatus("rebooked");
                  toast({ title: `${row.name} marked as rebooked`, type: "booking" });
                })
              }
            >
              {pending && action === "rebooked" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck className="h-4 w-4" />
              )}
              Mark rebooked
            </Button>
          </div>
        )}

        {status === "rebooked" && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> Came back — {money(row.avgSpend)} recovered
          </p>
        )}

        {status === "snoozed" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run("reactivate", () => reactivateWinback(row.id), () => setStatus("overdue"))
            }
          >
            {pending && action === "reactivate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
            Bring back to queue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function WinbackQueue({ rows }: { rows: WinbackRow[] }) {
  const [filter, setFilter] = useState<"all" | WinbackRow["status"]>("all");

  const counts = useMemo(() => {
    const c = { all: rows.length, overdue: 0, sent: 0, rebooked: 0, snoozed: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const tabs: { key: "all" | WinbackRow["status"]; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "overdue", label: `Overdue (${counts.overdue})` },
    { key: "sent", label: `Sent (${counts.sent})` },
    { key: "rebooked", label: `Rebooked (${counts.rebooked})` },
    { key: "snoozed", label: `Snoozed (${counts.snoozed})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === t.key
                ? "bg-oxblood text-white"
                : "bg-oat/50 text-muted-foreground hover:bg-oat"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing here right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visible.map((r) => (
            <Row key={r.id} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}
