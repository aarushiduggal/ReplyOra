import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/lib/data/analytics";

/** Grouped bar chart for the daily trend — conversations vs leads. */
export function TrendBars({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.conversations));
  return (
    <div className="flex items-end justify-between gap-3" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-[140px] w-full items-end justify-center gap-1">
            <Bar value={d.conversations} max={max} className="bg-oxblood" />
            <Bar value={d.leads} max={max} className="bg-rose" />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      className={cn("w-3 rounded-t", className)}
      style={{ height: `${Math.max(4, pct)}%` }}
      title={String(value)}
    />
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; className: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-sm", i.className)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Descending funnel of stages with conversion percentages. */
export function Funnel({
  stages,
}: {
  stages: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? stages[i - 1]! : null;
        const conv =
          prev && prev.value > 0
            ? Math.round((s.value / prev.value) * 100)
            : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{s.label}</span>
              <span className="text-muted-foreground">
                {s.value.toLocaleString()}
                {conv !== null && (
                  <span className="ml-2 text-xs text-rose">{conv}%</span>
                )}
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-oat">
              <div
                className="flex h-full items-center rounded-lg bg-oxblood px-3 text-xs font-medium text-cream"
                style={{ width: `${Math.max(8, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bars for a labelled breakdown (e.g. by page). */
export function HBars({
  data,
}: {
  data: { label: string; value: number; sub?: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink">{d.label}</span>
            <span className="text-muted-foreground">
              {d.value}
              {d.sub ? ` · ${d.sub}` : ""}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-oat">
            <div
              className="h-full rounded-full bg-rose"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
