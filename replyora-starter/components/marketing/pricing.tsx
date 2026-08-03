"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { PLANS, SETUP_FEE_AUD, TRIAL_DAYS } from "@/lib/stripe/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import type { Plan } from "@/lib/data/types";

// Paid plans only, 7-day trial. Replyora is a website-embed widget (no channels).
const ORDER: Plan[] = ["starter", "growth", "pro"];
const HIGHLIGHT: Plan = "growth";
const ANNUAL_DISCOUNT = 0.2; // ~20% off when billed annually

const BLURB: Record<Exclude<Plan, "none">, string> = {
  starter: "For a simple, single-site business whose info rarely changes.",
  growth: "Turn enquiries into booked jobs — and keep the assistant fresh.",
  pro: "A fully-managed, self-improving assistant with the growth engines.",
};

function features(plan: Plan): string[] {
  const p = PLANS[plan];
  const list = [
    `${p.messagesPerMonth.toLocaleString()} messages / mo`,
    `~${p.kbPages} pages knowledge base`,
    `${p.teamSeats} team seat${p.teamSeats > 1 ? "s" : ""}`,
    "Instant replies, lead capture & qualification",
  ];
  if (p.flags.booking) list.push("Booking & calendar + time-slot booking");
  if (p.flags.humanHandoff) list.push("Human handoff (live takeover)");
  if (p.flags.abandonedRecovery) list.push("Abandoned-enquiry recovery");
  if (p.flags.continuousRetrain) list.push("Continuous AI retraining");
  if (p.flags.reviewEngine) list.push("Review & reputation engine");
  if (p.flags.noShowReduction) list.push("No-show reduction reminders");
  if (p.flags.leadWinBack) list.push("AI lead win-back");
  list.push(
    p.flags.removeBranding
      ? "Remove “Powered by Replyora”"
      : "“Powered by Replyora” badge",
  );
  list.push(p.service.updateCadence);
  return list;
}

function monthlyPrice(plan: Plan, annual: boolean): number {
  const base = PLANS[plan].priceAud;
  return annual ? Math.round(base * (1 - ANNUAL_DISCOUNT)) : base;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          Pricing
        </p>
        <h2 className="mt-3 font-display text-4xl text-oxblood">
          Plans that scale with your bookings
        </h2>
        <p className="mt-4 text-ink/70">
          Start with a {TRIAL_DAYS}-day free trial. Prices in AUD.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1 text-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              !annual ? "bg-oxblood text-cream" : "text-ink/70",
            )}
            aria-pressed={!annual}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              annual ? "bg-oxblood text-cream" : "text-ink/70",
            )}
            aria-pressed={annual}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-rose/20 px-1.5 py-0.5 text-xs text-wine">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {ORDER.map((plan) => {
          const p = PLANS[plan];
          const highlighted = plan === HIGHLIGHT;
          const price = monthlyPrice(plan, annual);
          return (
            <div
              key={plan}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                highlighted
                  ? "border-oxblood ring-2 ring-oxblood/20"
                  : "border-border",
              )}
            >
              {highlighted && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-oxblood px-3 py-1 text-xs font-semibold text-cream">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl text-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-ink/70">
                {BLURB[plan as Exclude<Plan, "none">]}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl text-oxblood">
                  ${price}
                </span>
                <span className="text-sm text-ink/60">/mo</span>
              </div>
              <p className="mt-1 text-xs text-ink/60">
                {annual
                  ? `billed annually ($${price * 12}/yr)`
                  : "billed monthly"}
              </p>
              <div className="mt-2 rounded-lg bg-oat/70 px-3 py-2">
                <p className="text-xs font-medium text-wine">
                  + ${SETUP_FEE_AUD} one-time setup
                </p>
                <p className="text-xs text-ink/70">
                  Done-for-you setup &amp; training
                </p>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {features(plan).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                    <span className="text-ink/80">{f}</span>
                  </li>
                ))}
                {plan === "pro" && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded-full bg-oat px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
                      Soon
                    </span>
                    <span className="text-ink/60">
                      AI voice &amp; phone answering{" "}
                      <span className="text-ink/40">— coming soon</span>
                    </span>
                  </li>
                )}
              </ul>
              <Button
                asChild
                className="mt-6 w-full"
                variant={highlighted ? "default" : "outline"}
                onClick={() => track("cta_pricing", { plan })}
              >
                <Link href={`/signup?plan=${plan}`}>
                  Start {TRIAL_DAYS}-day trial
                </Link>
              </Button>
              <p className="mt-2 text-center text-xs text-ink/60">
                No card to start · cancel anytime
              </p>
            </div>
          );
        })}
      </div>

      <PlanMatrix />
    </section>
  );
}

type Cell = boolean | string;
const MATRIX: { label: string; values: [Cell, Cell, Cell] }[] = [
  {
    label: "Messages / month",
    values: [
      PLANS.starter.messagesPerMonth.toLocaleString(),
      PLANS.growth.messagesPerMonth.toLocaleString(),
      PLANS.pro.messagesPerMonth.toLocaleString(),
    ],
  },
  {
    label: "Knowledge base",
    values: [
      `~${PLANS.starter.kbPages} pages`,
      `~${PLANS.growth.kbPages} pages`,
      `~${PLANS.pro.kbPages} pages`,
    ],
  },
  {
    label: "Team seats",
    values: [
      String(PLANS.starter.teamSeats),
      String(PLANS.growth.teamSeats),
      String(PLANS.pro.teamSeats),
    ],
  },
  { label: "Website widget", values: [true, true, true] },
  { label: "Lead capture & qualification", values: [true, true, true] },
  { label: "Booking & calendar (time-slot)", values: [false, true, true] },
  { label: "Human handoff", values: [false, true, true] },
  { label: "Remove “Powered by Replyora”", values: [false, true, true] },
  { label: "Abandoned-enquiry recovery", values: [false, true, true] },
  { label: "Continuous AI retraining", values: [false, false, true] },
  { label: "Review & reputation engine", values: [false, false, true] },
  { label: "No-show reduction", values: [false, false, true] },
  { label: "AI lead win-back", values: [false, false, true] },
  {
    label: "AI voice & phone answering",
    values: [false, false, "Coming soon"],
  },
  {
    label: "Done-for-you updates",
    values: ["1 / quarter", "Proactive 90-day", "Anytime"],
  },
  {
    label: "Performance review call",
    values: [false, "Every 90 days", "Every 60 days"],
  },
  {
    label: "Support",
    values: ["Email", "Priority", "Priority + onboarding"],
  },
];

function PlanMatrix() {
  return (
    <div className="mt-16">
      <h3 className="text-center font-display text-2xl text-oxblood">
        Compare all plans
      </h3>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-oat/50">
              <th className="p-4 text-left font-medium text-ink">Feature</th>
              {ORDER.map((p) => (
                <th
                  key={p}
                  className={cn(
                    "p-4 text-center font-display text-lg",
                    p === HIGHLIGHT ? "text-oxblood" : "text-ink/80",
                  )}
                >
                  {PLANS[p].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="p-4 text-ink/80">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="p-4 text-center">
                    {v === true ? (
                      <Check className="mx-auto h-4 w-4 text-rose" />
                    ) : v === false ? (
                      <Minus className="mx-auto h-4 w-4 text-ink/30" />
                    ) : (
                      <span className="text-ink/80">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
