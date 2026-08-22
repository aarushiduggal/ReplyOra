"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { chooseAccountTypeAction } from "@/app/onboarding/actions";
import type { SocialPlan, BillingInterval } from "@/lib/social/plans";
import { SOCIAL_PLAN_PRICE, CLIENT_LIMIT } from "@/lib/social/plans";

const PLANS: {
  type: SocialPlan;
  name: string;
  blurb: string;
  featured?: boolean;
  features: string[];
}[] = [
  {
    type: "personal",
    name: "Personal",
    blurb: "For one brand, fully handled.",
    features: [
      `${CLIENT_LIMIT.personal} client / brand account`,
      "Calendar, scheduling & grid preview",
      "Asset library + phone uploads",
      "Planner, approvals & client portal",
    ],
  },
  {
    type: "studio",
    name: "Studio",
    blurb: "For a small studio, a few brands.",
    featured: true,
    features: [
      `Up to ${CLIENT_LIMIT.studio} client / brand accounts`,
      "Everything in Personal",
      "Studio — Dump & Pair from shoots",
      "Performance reports + PDF export",
    ],
  },
  {
    type: "agency",
    name: "Agency",
    blurb: "For agencies managing clients.",
    features: [
      `Up to ${CLIENT_LIMIT.agency} client / brand accounts`,
      "Everything in Studio",
      "Team seats + client invoicing",
      "AI website chatbox included (all clients)",
    ],
  },
];

export function AccountTypeChooser({
  name,
  preselect,
  stripeReady,
  /** Inside the free 30-day beta window: choose a plan, no card, no Stripe. */
  beta = false,
  betaDaysLeft = 0,
}: {
  name: string;
  preselect?: SocialPlan;
  stripeReady?: boolean;
  beta?: boolean;
  betaDaysLeft?: number;
}) {
  const [selected, setSelected] = useState<SocialPlan>(preselect ?? "studio");
  const [cycle, setCycle] = useState<BillingInterval>("monthly");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const working = pending || busy;

  async function start() {
    setError(null);
    // When Stripe is live, collect the card up front via Checkout (7-day trial).
    // Dashboard access is only granted after /onboarding/complete verifies it —
    // and a hiccup NEVER grants free access; the user just retries.
    // Beta testers were promised 30 days with no card. Sending them into
    // Stripe Checkout here would break that promise on the very first screen,
    // which is also the screen where they decide whether to bother at all.
    if (stripeReady && !beta) {
      setBusy(true);
      try {
        const res = await fetch("/api/social/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selected, interval: cycle, from: "onboarding" }),
        });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }
        setError("Couldn't start checkout. Please try again.");
      } catch {
        setError("Couldn't reach checkout — check your connection and try again.");
      }
      setBusy(false);
      return;
    }
    // Stripe not configured at all → legacy no-card provisioning.
    startTransition(() => chooseAccountTypeAction(selected));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-oxblood">
        Welcome{name ? `, ${name}` : ""}
      </p>
      <h1 className="mt-3 font-display text-4xl text-oxblood">
        {beta ? "Pick how you'll use Replyora" : "Pick the plan to start your free trial"}
      </h1>
      <p className="mt-2 max-w-lg text-sm font-medium text-ink/85">
        {beta ? (
          <>
            You&apos;re on the beta — everything is unlocked free for{" "}
            {betaDaysLeft > 0 ? `${betaDaysLeft} more days` : "30 days"}, and no
            card is needed. This just sets up your workspace; you can change it
            later in Settings.
          </>
        ) : (
          <>
            7 days free on any plan — a card is collected up front and it
            auto-converts, cancel anytime. You can switch plans later in
            Settings.
          </>
        )}
      </p>

      {/* Monthly / Annual toggle (annual = 2 months free). Meaningless during
          the beta — nothing is being charged on either cycle. */}
      <div className={`mt-6 flex items-center gap-3 ${beta ? "hidden" : ""}`}>
        <div className="inline-flex items-center gap-1 rounded-full border border-oxblood/15 bg-white p-1">
          {(["monthly", "yearly"] as BillingInterval[]).map((c) => (
            <button
              key={c}
              type="button"
              disabled={working}
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                cycle === c ? "bg-oxblood text-cream" : "text-ink/60 hover:text-oxblood"
              }`}
            >
              {c === "yearly" ? "Annual" : "Monthly"}
            </button>
          ))}
        </div>
        {cycle === "yearly" && (
          <span className="text-xs font-semibold uppercase tracking-widest text-roseink">
            2 months free
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {PLANS.map((p) => {
          const price = SOCIAL_PLAN_PRICE[p.type];
          const active = selected === p.type;
          return (
            <button
              key={p.type}
              type="button"
              disabled={working}
              onClick={() => setSelected(p.type)}
              aria-pressed={active}
              className={`flex flex-col rounded-2xl border p-6 text-left transition-colors ${
                active
                  ? "border-oxblood bg-oxblood/[0.04] ring-1 ring-oxblood"
                  : "border-ink/15 hover:border-oxblood/40"
              } disabled:opacity-70`}
            >
              {p.featured && (
                <span className="mb-2 inline-flex w-fit rounded-full bg-oxblood/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                  Most popular
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl text-oxblood">{p.name}</span>
                {active && <Check className="h-4 w-4 text-oxblood" />}
              </div>
              <p className="mt-1 text-[12px] font-medium text-ink/75">{p.blurb}</p>
              <p className="mt-3 font-display text-2xl text-ink">
                ${cycle === "monthly" ? price.monthly : price.yearly}
                <span className="font-sans text-xs text-ink/50">
                  {" "}
                  {cycle === "monthly" ? "/mo" : "/yr"} AUD
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-oxblood" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* The AI website chatbox is switched on per client later (per-site), so
          there's nothing to add here — the trial is just the plan. */}

      {error && (
        <p className="mt-6 text-sm text-rose-700">{error}</p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={working}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-oxblood px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-oxblood/90 disabled:opacity-70"
      >
        {working && <Loader2 className="h-4 w-4 animate-spin" />}
        {beta
          ? "Open my workspace →"
          : stripeReady
            ? "Start 7-day free trial — add card"
            : "Start 7-day free trial"}
      </button>
      {stripeReady && !beta && (
        <p className="mt-2 text-xs text-ink/55">
          You&apos;ll add a card on the next screen. It&apos;s free for 7 days and
          auto-converts — cancel anytime.
        </p>
      )}
    </div>
  );
}
