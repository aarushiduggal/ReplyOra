"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { chooseAccountTypeAction } from "@/app/onboarding/actions";
import type { SocialPlan } from "@/lib/social/plans";
import {
  SOCIAL_PLAN_PRICE,
  CHATBOX_ADDON_PRICE,
  CURRENCY,
  CLIENT_LIMIT,
} from "@/lib/social/plans";

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
}: {
  name: string;
  preselect?: SocialPlan;
}) {
  const [selected, setSelected] = useState<SocialPlan>(preselect ?? "studio");
  const [chatbox, setChatbox] = useState(false);
  const [pending, startTransition] = useTransition();

  const agency = selected === "agency";

  function start() {
    startTransition(() => chooseAccountTypeAction(selected, chatbox));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-oxblood">
        Welcome{name ? `, ${name}` : ""}
      </p>
      <h1 className="mt-3 font-display text-4xl text-oxblood">
        Pick the plan to start your free trial
      </h1>
      <p className="mt-2 max-w-lg text-sm font-medium text-ink/85">
        7 days free on any plan — a card is collected up front and it auto-converts,
        cancel anytime. You can switch plans later in Settings.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {PLANS.map((p) => {
          const price = SOCIAL_PLAN_PRICE[p.type];
          const active = selected === p.type;
          return (
            <button
              key={p.type}
              type="button"
              disabled={pending}
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
                ${price.monthly}
                <span className="font-sans text-xs text-ink/50"> /mo {CURRENCY}</span>
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

      {/* Add-ons — "the things" you can pick when starting the trial */}
      <div className="mt-6 rounded-2xl border border-ink/15 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">
          Add-ons
        </p>
        <label
          className={`mt-3 flex cursor-pointer items-start gap-3 ${agency ? "opacity-70" : ""}`}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-oxblood"
            checked={agency ? true : chatbox}
            disabled={agency || pending}
            onChange={(e) => setChatbox(e.target.checked)}
          />
          <span className="text-sm text-ink/85">
            <span className="font-semibold text-oxblood">AI website chatbox</span>{" "}
            {agency ? (
              <span className="text-ink/60">— included free with Agency</span>
            ) : (
              <span className="text-ink/60">
                — +${CHATBOX_ADDON_PRICE}/mo {CURRENCY} per site. Answers visitors,
                captures leads and books 24/7.
              </span>
            )}
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-oxblood px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-oxblood/90 disabled:opacity-70"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Start 7-day free trial
      </button>
    </div>
  );
}
