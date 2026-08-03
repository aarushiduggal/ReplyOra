import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  /** When set, the whole card becomes a link. */
  href?: string;
}) {
  const card = (
    <Card className={cn(href && "transition-colors hover:border-oxblood/40 hover:bg-oat/40")}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
          <Icon className="h-5 w-5" />
          {href && (
            <ArrowUpRight className="absolute -right-1 -top-1 h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
