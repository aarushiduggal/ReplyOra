import { CalendarClock, RefreshCw, PhoneCall, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanConfig } from "@/lib/stripe/plans";

/**
 * Managed-service commitments — a dashboard reminder/log, NOT an automated
 * feature. Shows the done-for-you update cadence and the next scheduled
 * performance call / proactive refresh for the plan. See PACKAGES.md.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Next date that is `intervalDays` steps on from `startISO` and still future. */
function nextDate(startISO: string, intervalDays: number): string {
  const start = new Date(startISO).getTime();
  const now = Date.now();
  const step = intervalDays * DAY_MS;
  let next = start + step;
  while (next < now) next += step;
  return new Date(next).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ServiceCard({
  plan,
  createdAt,
}: {
  plan: PlanConfig;
  createdAt: string;
}) {
  const { service } = plan;
  const rows: { icon: typeof RefreshCw; text: string }[] = [
    { icon: RefreshCw, text: service.updateCadence },
  ];

  if (service.extraUpdateFeeAud != null) {
    rows.push({
      icon: Sparkles,
      text: `Extra done-for-you updates: $${service.extraUpdateFeeAud} each`,
    });
  }
  if (service.proactiveRefresh && plan.key === "growth") {
    rows.push({
      icon: CalendarClock,
      text: `Next proactive refresh: ${nextDate(createdAt, 90)}`,
    });
  }
  if (service.performanceCallDays != null) {
    rows.push({
      icon: PhoneCall,
      text: `Next performance review call: ${nextDate(
        createdAt,
        service.performanceCallDays,
      )}`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Managed service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
              <span className="text-ink/80">{r.text}</span>
            </div>
          );
        })}
        {plan.key === "none" && (
          <p className="text-xs text-muted-foreground">
            Choose a plan to unlock done-for-you updates and performance reviews.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
