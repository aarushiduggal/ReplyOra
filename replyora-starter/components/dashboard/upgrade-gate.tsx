import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLANS, minPlanFor, FEATURE_LABELS, type PlanFlag } from "@/lib/stripe/plans";

/**
 * Shown when the current plan doesn't include a premium feature. Names the
 * lowest plan that unlocks it and links to billing. Used to gate booking,
 * human handoff, and (in Stage 2) the Pro-only engines.
 */
export function UpgradeGate({
  flag,
  description,
}: {
  flag: PlanFlag;
  description: string;
}) {
  const target = PLANS[minPlanFor(flag)];
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-oxblood/20 bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-oxblood/10 text-oxblood">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl text-oxblood">
        {FEATURE_LABELS[flag]} is a {target.name} feature
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard/settings">Upgrade to {target.name}</Link>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        From ${target.priceAud}/mo · keep everything you&apos;ve already set up.
      </p>
    </div>
  );
}
