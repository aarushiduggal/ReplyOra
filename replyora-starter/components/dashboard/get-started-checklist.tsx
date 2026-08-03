import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChecklistStep {
  label: string;
  description: string;
  href: string;
  done: boolean;
}

/**
 * First-run "Get started" checklist shown on the overview until setup is
 * complete. The next incomplete step is highlighted as the call to action.
 */
export function GetStartedChecklist({ steps }: { steps: ChecklistStep[] }) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card className="border-oxblood/30 bg-linear-to-br from-oat/50 to-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Get started</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {total} steps complete — finish setup to start
            capturing leads.
          </p>
        </div>
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-oxblood/20 font-display text-sm text-oxblood sm:flex">
          {pct}%
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const isNext = step === nextStep;
          return (
            <Link
              key={step.href}
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
                isNext
                  ? "border-oxblood bg-card shadow-sm"
                  : "border-transparent hover:bg-card",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-transparent bg-oxblood text-cream"
                    : "border-border bg-background",
                )}
              >
                {step.done && <Check className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium text-ink",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
              {isNext && (
                <ArrowRight className="h-4 w-4 shrink-0 text-oxblood" />
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
