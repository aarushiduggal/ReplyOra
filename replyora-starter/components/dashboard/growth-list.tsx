"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Send } from "lucide-react";

import { fireGrowthAction } from "@/lib/data/growth-actions";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface GrowthRow {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  done: boolean;
  doneLabel: string;
}

export function GrowthActionList({
  kind,
  path,
  actionLabel,
  emptyLabel,
  rows,
}: {
  kind: "abandoned" | "review" | "reminder" | "winback";
  path: string;
  actionLabel: string;
  emptyLabel: string;
  rows: GrowthRow[];
}) {
  const [items, setItems] = useState(rows);
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function fire(id: string) {
    setBusyId(id);
    start(async () => {
      await fireGrowthAction(kind, id, path);
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, done: true } : r)));
      setBusyId(null);
      toast({ title: `${actionLabel} sent`, type: "success" });
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {r.meta && (
                <span className="text-xs text-muted-foreground">{r.meta}</span>
              )}
              {r.done ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> {r.doneLabel}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => fire(r.id)}
                  disabled={pending && busyId === r.id}
                >
                  {pending && busyId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {actionLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
