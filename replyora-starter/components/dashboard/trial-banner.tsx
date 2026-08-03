import Link from "next/link";
import { Clock, Lock } from "lucide-react";

import type { EntitlementState } from "@/lib/data/entitlement";

/** Thin status strip shown across the dashboard during/after the trial. */
export function TrialBanner({
  state,
  daysLeft,
  planName,
}: {
  state: EntitlementState;
  daysLeft: number | null;
  planName?: string;
}) {
  if (state === "active") return null;

  const planLabel = planName ? `${planName} ` : "";

  if (state === "trialing") {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-rose/30 bg-oat/70 px-4 py-2 text-sm text-wine">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          {daysLeft === 0
            ? `Last day of your ${planLabel}trial.`
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your ${planLabel}free trial.`}
        </span>
        <Link
          href="/dashboard/settings"
          className="font-semibold underline underline-offset-2 hover:text-oxblood"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // trial_ended or locked
  return (
    <div className="flex items-center justify-center gap-2 border-b border-oxblood/30 bg-oxblood px-4 py-2 text-sm text-cream">
      <Lock className="h-4 w-4 shrink-0" />
      <span>Your free trial has ended — your assistant is paused.</span>
      <Link
        href="/dashboard/settings"
        className="font-semibold underline underline-offset-2 hover:text-blush"
      >
        Subscribe to reactivate
      </Link>
    </div>
  );
}
