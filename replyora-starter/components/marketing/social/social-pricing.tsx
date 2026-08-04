"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type Cycle = "monthly" | "yearly";

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
  featured: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Personal",
    tagline: "For one business, fully handled.",
    monthly: 50,
    yearly: 500,
    features: [
      "1 brand",
      "Instagram & TikTok",
      "AI captions & post ideas",
      "Grid planner",
      "Content calendar",
      "Unlimited scheduling",
      "Brand kit",
    ],
    featured: false,
  },
  {
    name: "Agency",
    tagline: "For managing client brands.",
    monthly: 200,
    yearly: 2000,
    features: [
      "Everything in Personal",
      "Up to 10 client brands",
      "Client portal & approvals",
      "Client invoicing (branded PDFs)",
      "Performance reports",
      "Priority support",
    ],
    featured: true,
  },
];

export function SocialPricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <div>
      {/* toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-oxblood/15 bg-white p-1">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                cycle === c ? "bg-oxblood text-cream" : "text-ink/60 hover:text-oxblood"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const price = cycle === "monthly" ? plan.monthly : Math.round(plan.yearly / 12);
          return (
            <div
              key={plan.name}
              className={`flex flex-col rounded-3xl border p-8 ${
                plan.featured
                  ? "border-oxblood bg-oxblood text-cream shadow-lg"
                  : "border-oxblood/15 bg-white text-ink"
              }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-cream/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest">
                  Most popular
                </span>
              )}
              <h3 className={`font-display text-2xl ${plan.featured ? "text-cream" : "text-oxblood"}`}>
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.featured ? "text-cream/80" : "text-ink/60"}`}>
                {plan.tagline}
              </p>
              <p className="mt-5 font-display text-4xl">
                ${price}
                <span className={`font-sans text-base ${plan.featured ? "text-cream/70" : "text-ink/50"}`}>
                  {" "}
                  /mo
                </span>
              </p>
              <p className={`mt-1 text-xs ${plan.featured ? "text-cream/60" : "text-ink/45"}`}>
                {cycle === "yearly"
                  ? `Billed $${plan.yearly.toLocaleString()} yearly (AUD)`
                  : "Billed monthly (AUD)"}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-blush" : "text-rose"}`} />
                    <span className={plan.featured ? "text-cream/90" : "text-ink/75"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 rounded-full ${plan.featured ? "bg-cream text-oxblood hover:bg-cream/90" : ""}`}
                variant={plan.featured ? "default" : "outline"}
              >
                <Link href="/signup">
                  {cycle === "yearly"
                    ? "Start 2-week free trial"
                    : "Start 7-day free trial"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-ink/50">
        No card to start · cancel anytime. Optional add-on: an AI assistant that
        answers enquiries on your website.
      </p>
    </div>
  );
}
