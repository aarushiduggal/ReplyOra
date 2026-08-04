"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { chooseAccountTypeAction } from "@/app/onboarding/actions";
import type { SocialPlan } from "@/lib/social/plans";

const PLANS: {
  type: SocialPlan;
  name: string;
  price: string;
  blurb: string;
  features: string[];
}[] = [
  {
    type: "personal",
    name: "Personal",
    price: "A$50/mo",
    blurb: "For a creator or a single brand.",
    features: [
      "One brand workspace",
      "Grid planner, calendar & AI captions",
      "Client-style approvals & reports",
      "Website chatbox add-on",
    ],
  },
  {
    type: "agency",
    name: "Agency",
    price: "A$200/mo",
    blurb: "For managing multiple clients.",
    features: [
      "Unlimited client workspaces",
      "Everything in Personal, per client",
      "Client review portals & invoicing",
      "Team to-do board",
    ],
  },
];

export function AccountTypeChooser({ name }: { name: string }) {
  const [selected, setSelected] = useState<SocialPlan | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(type: SocialPlan) {
    setSelected(type);
    startTransition(() => chooseAccountTypeAction(type));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-oxblood">
        Welcome{name ? `, ${name}` : ""}
      </p>
      <h1 className="mt-3 font-display text-4xl text-oxblood">
        How will you use ReplyOra?
      </h1>
      <p className="mt-2 max-w-lg text-sm font-medium text-ink/85">
        Pick the plan that fits — both start with a free trial, no card needed.
        You can switch anytime.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {PLANS.map((p) => (
          <button
            key={p.type}
            type="button"
            disabled={pending}
            onClick={() => choose(p.type)}
            className={`rounded-2xl border p-6 text-left transition-colors ${
              selected === p.type
                ? "border-oxblood bg-oxblood/[0.04]"
                : "border-ink/15 hover:border-oxblood/40"
            } disabled:opacity-70`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl text-oxblood">{p.name}</span>
              <span className="text-sm font-semibold text-ink">{p.price}</span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-ink/75">{p.blurb}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-ink/85">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-oxblood" />
                  {f}
                </li>
              ))}
            </ul>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream">
              {pending && selected === p.type ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Start free trial
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
