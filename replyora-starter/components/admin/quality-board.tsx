"use client";

import { useState, useTransition } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";

import { adminResolveGap } from "@/lib/admin/actions";
import { toast } from "@/lib/toast";

export interface GapItem {
  clientId: string;
  clientName: string;
  question: string;
  count: number;
}
export interface FlaggedItem {
  clientId: string;
  clientName: string;
  plan: string;
  unansweredCount: number;
}

const card = "rounded-xl border border-border bg-white p-5";

export function QualityBoard({
  gaps,
  flagged,
}: {
  gaps: GapItem[];
  flagged: FlaggedItem[];
}) {
  const [pending, start] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  function key(g: GapItem) {
    return `${g.clientId}::${g.question}`;
  }

  function resolve(g: GapItem) {
    const k = key(g);
    const answer = (answers[k] ?? "").trim();
    if (!answer) return;
    start(async () => {
      await adminResolveGap(g.clientId, g.question, answer);
      setResolved((prev) => new Set(prev).add(k));
      toast({ title: "Added to the client's knowledge base", type: "success" });
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-ink">Flagged assistants</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flagged.map((f) => (
            <div key={f.clientId} className={card}>
              <p className="font-medium text-ink">{f.clientName}</p>
              <p className="mt-0.5 text-xs capitalize text-ink/50">{f.plan} plan</p>
              <p className="mt-2 text-2xl text-rose-600">{f.unansweredCount}</p>
              <p className="text-xs text-ink/50">couldn&apos;t-answer questions</p>
            </div>
          ))}
          {flagged.length === 0 && <p className="text-sm text-ink/50">No assistants flagged.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ink/60" />
          <h2 className="font-semibold text-ink">Knowledge-gap suggestions</h2>
          <span className="text-xs text-ink/50">
            Answer once → added to the client&apos;s KB (feeds Pro continuous retraining)
          </span>
        </div>
        <div className="space-y-2">
          {gaps.map((g) => {
            const k = key(g);
            const done = resolved.has(k);
            return (
              <div key={k} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-ink">
                    <span className="text-ink/60">{g.clientName} — </span>“{g.question}”
                  </p>
                  <span className="rounded-full bg-oat px-2 py-0.5 text-xs text-ink/60">
                    asked {g.count}×
                  </span>
                </div>
                {done ? (
                  <p className="mt-2 text-sm text-emerald-600">✓ Added to knowledge base</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={answers[k] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [k]: e.target.value })}
                      placeholder="Write the answer the assistant should give…"
                      className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
                    />
                    <button
                      disabled={pending || !(answers[k] ?? "").trim()}
                      onClick={() => resolve(g)}
                      className="rounded-lg bg-oxblood px-3 py-2 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
                    >
                      Add to KB
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {gaps.length === 0 && <p className="text-sm text-ink/50">No knowledge gaps right now.</p>}
        </div>
      </section>
    </div>
  );
}
