"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { addTrainingAnswer } from "@/lib/data/growth-actions";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface GapRow {
  id: string;
  question: string;
  count: number;
  resolved: boolean;
}

export function TrainingQueue({ rows }: { rows: GapRow[] }) {
  const [items, setItems] = useState(rows);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function resolve(id: string, question: string) {
    const a = (answers[id] ?? "").trim();
    if (!a) return;
    start(async () => {
      const res = await addTrainingAnswer(id, question, a);
      if (!res.ok) {
        toast({ title: res.error ?? "Couldn't add", type: "error" });
        return;
      }
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
      toast({ title: "Added to your knowledge base", type: "success" });
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No unanswered questions right now. Your assistant is keeping up.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <Card key={r.id}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink">
                <span className="text-muted-foreground">Asked {r.count}× — </span>
                “{r.question}”
              </p>
              {r.resolved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" /> Learned
                </span>
              )}
            </div>
            {!r.resolved && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={answers[r.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [r.id]: e.target.value })}
                  placeholder="Write the answer your assistant should give…"
                  className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-oxblood"
                />
                <Button
                  onClick={() => resolve(r.id, r.question)}
                  disabled={pending || !(answers[r.id] ?? "").trim()}
                >
                  Add to knowledge base
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
