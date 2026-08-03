"use client";

import { Check, Lock } from "lucide-react";

import { PLANS, SETUP_FEE_AUD } from "@/lib/stripe/plans";
import { startCheckout } from "@/lib/stripe/checkout-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/data/types";

const ORDER: Plan[] = ["starter", "growth", "pro"];
const DEFAULT_HIGHLIGHT: Plan = "growth";

/**
 * Paywall shown when a workspace's trial has ended (or it's not entitled).
 * Blocks the assistant / install features until they subscribe. Highlights the
 * plan they were trialing (`current`) so the card payment continues that plan.
 */
export function Paywall({
  feature = "your assistant",
  current,
}: {
  feature?: string;
  /** The plan the workspace was trialing — pre-highlighted for continuation. */
  current?: Plan;
}) {
  const highlight: Plan =
    current && current !== "none" ? current : DEFAULT_HIGHLIGHT;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-oxblood/20 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-oxblood/10 text-oxblood">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-3xl text-oxblood">
          Your free trial has ended
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Subscribe to keep {feature} live and continue capturing leads and
          bookings. Pick a plan below to reactivate instantly.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ORDER.map((plan) => {
            const p = PLANS[plan];
            const highlighted = plan === highlight;
            const isTrialed = current && current !== "none" && plan === current;
            return (
              <div
                key={plan}
                className={cn(
                  "rounded-xl border bg-card p-5 text-left",
                  highlighted
                    ? "border-oxblood ring-2 ring-oxblood/20"
                    : "border-border",
                )}
              >
                {highlighted && (
                  <span className="mb-2 inline-flex rounded-full bg-oxblood px-2.5 py-0.5 text-xs font-semibold text-cream">
                    {isTrialed ? "Your plan" : "Most popular"}
                  </span>
                )}
                <h3 className="font-display text-xl text-ink">{p.name}</h3>
                <p className="mt-1 font-display text-2xl text-oxblood">
                  ${p.priceAud}
                  <span className="text-sm text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  + ${SETUP_FEE_AUD} one-time setup
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-ink/80">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-rose" />
                    {p.messagesPerMonth.toLocaleString()} messages/mo
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-rose" />~{p.kbPages} pages
                    KB · {p.teamSeats} seats
                  </li>
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={highlighted ? "default" : "outline"}
                  onClick={() => void startCheckout(plan)}
                >
                  Subscribe
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Card checkout is being finalised — to activate right now, email{" "}
          <a
            href="mailto:hello.replyora@gmail.com"
            className="text-oxblood hover:underline"
          >
            hello.replyora@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
