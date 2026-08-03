import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Meter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const near = pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/80">{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString()} / {limit.toLocaleString()}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-oat">
        <div
          className={near ? "h-full bg-rose" : "h-full bg-oxblood"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageCard({
  planName,
  messagesUsed,
  messagesLimit,
  kbUsedPages,
  kbLimitPages,
}: {
  planName: string;
  messagesUsed: number;
  messagesLimit: number;
  kbUsedPages: number;
  kbLimitPages: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Usage · {planName} plan</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/settings">Manage plan</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <Meter
          label="Messages this month"
          used={messagesUsed}
          limit={messagesLimit}
        />
        <Meter
          label="Knowledge base"
          used={kbUsedPages}
          limit={kbLimitPages}
          unit="pages"
        />
      </CardContent>
    </Card>
  );
}
