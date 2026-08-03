import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Reusable empty state for list screens with no data yet.
 * Polished, on-brand, with an optional primary action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oat text-oxblood">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        {actionLabel && actionHref && (
          <Button asChild className="mt-2">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
