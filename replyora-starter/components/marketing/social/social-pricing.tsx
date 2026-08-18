"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SOCIAL_PLAN_PRICE, CHATBOX_ADDON_PRICE, CURRENCY } from "@/lib/social/plans";

type Cycle = "monthly" | "yearly";
type PlanKey = "personal" | "studio" | "agency";

const PLANS: {
  key: PlanKey;
  name: string;
  tagline: string;
  featured: boolean;
  features: string[];
}[] = [
  {
    key: "personal",
    name: "Personal",
    tagline: "For one brand, fully handled.",
    featured: false,
    features: [
      "1 client / brand account",
      "1 seat",
      "Instagram, Facebook & TikTok",
      "Calendar, scheduling & grid preview",
      "Asset library + phone uploads",
      "Planner, approvals & client portal",
      "Brand kits, pillars & to-dos",
    ],
  },
  {
    key: "studio",
    name: "Studio",
    tagline: "For a small studio, a few brands.",
    featured: true,
    features: [
      "Up to 3 client / brand accounts",
      "1 seat",
      "Everything in Personal",
      "Studio — Dump & Pair drafts from shoots",
      "Performance reports + PDF export",
      "Client invoicing + PDF exports",
      "Shared workspace asset library",
      "Cross-client task tracking",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    tagline: "For agencies managing clients.",
    featured: false,
    features: [
      "Up to 8 client / brand accounts",
      "Team seats (Full / Limited)",
      "Everything in Studio",
      "Client invoicing + branded PDF exports",
      "Revenue hub & per-client billing",
      "AI website chatbox included (all clients)",
      "Priority support",
    ],
  },
];

type Cell = string | boolean;
const COMPARE: { label: string; vals: [Cell, Cell, Cell] }[] = [
  { label: "Client / brand accounts", vals: ["1", "Up to 3", "Up to 8"] },
  { label: "Social connections (IG, Facebook, TikTok)", vals: [true, true, true] },
  { label: "Content calendar, scheduling & grid preview", vals: [true, true, true] },
  { label: "Asset library + mobile / iPhone uploads", vals: [true, true, true] },
  { label: "Planner, approval queue & client portal", vals: [true, true, true] },
  { label: "To-Do / task tracking", vals: [true, true, true] },
  { label: "Brand kits, pillars, notes & feature controls", vals: [true, true, true] },
  { label: "Studio — Dump & Pair drafts from shoots", vals: [false, true, true] },
  { label: "Performance reports + PDF export", vals: [false, true, true] },
  { label: "Shared workspace asset library", vals: [false, true, true] },
  { label: "Cross-client task tracking", vals: [false, true, true] },
  { label: "Client invoicing + branded PDF exports", vals: [false, true, true] },
  { label: "Workspace team seats (Full / Limited)", vals: [false, false, true] },
  { label: "Revenue hub & per-client billing settings", vals: [false, false, true] },
  { label: "AI website chatbox", vals: ["$39/site", "$39/site", "Included"] },
];

export function SocialPricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <div>
      {/* billing cycle toggle */}
      <div className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-oxblood/15 bg-white p-1">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                cycle === c ? "bg-oxblood text-cream" : "text-ink/60 hover:text-oxblood"
              }`}
            >
              {c === "yearly" ? "Annual" : "Monthly"}
            </button>
          ))}
        </div>
        {cycle === "yearly" && (
          <p className="text-xs font-semibold uppercase tracking-widest text-roseink">2 months free</p>
        )}
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const p = SOCIAL_PLAN_PRICE[plan.key];
          const perMonth = cycle === "monthly" ? p.monthly : Math.round(p.yearly / 12);
          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-3xl border p-7 ${
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
                ${perMonth}
                <span className={`font-sans text-base ${plan.featured ? "text-cream/70" : "text-ink/50"}`}>
                  {" "}
                  /mo {CURRENCY}
                </span>
              </p>
              <p className={`mt-1 text-xs ${plan.featured ? "text-cream/60" : "text-ink/45"}`}>
                {cycle === "yearly"
                  ? `Billed $${p.yearly.toLocaleString()}/yr ${CURRENCY} · 2 months free`
                  : `Billed monthly ${CURRENCY}`}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-blush" : "text-roseink"}`} />
                    <span className={plan.featured ? "text-cream/90" : "text-ink/75"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 rounded-full ${plan.featured ? "bg-cream text-oxblood hover:bg-cream/90" : ""}`}
                variant={plan.featured ? "default" : "outline"}
              >
                <Link href={`/signup?plan=${plan.key}`}>Start 7-day free trial</Link>
              </Button>
              {plan.key === "agency" && (
                <a
                  href="mailto:hello.replyora@gmail.com?subject=More%20than%208%20clients"
                  className={`mt-3 block text-center text-[11px] font-semibold uppercase tracking-[0.12em] ${plan.featured ? "text-cream/70" : "text-ink/50"} hover:text-roseink`}
                >
                  Need more than 8 clients? Contact us
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-ink/50">
        7-day free trial on every plan (card required, auto-converts) · cancel anytime.
        Add the <strong>AI website chatbox</strong> for ${CHATBOX_ADDON_PRICE}/mo {CURRENCY} per site.
      </p>

      {/* Full feature comparison — shown inline on the page */}
      <div className="mx-auto mt-16 max-w-4xl">
        <div className="mb-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-roseink">( Compare plans )</p>
          <h2 className="mt-2 font-display text-3xl text-oxblood">Every feature, side by side</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-oxblood/15 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-2/5" />
                {PLANS.map((p) => {
                  const price = SOCIAL_PLAN_PRICE[p.key];
                  const perMonth = cycle === "monthly" ? price.monthly : Math.round(price.yearly / 12);
                  return (
                    <th key={p.key} className="px-2 pb-3 pt-1 text-center align-bottom">
                      <span
                        className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${p.featured ? "text-roseink" : "text-ink/70"}`}
                      >
                        {p.name}
                        {p.featured ? " ★" : ""}
                      </span>
                      <span className="block font-display text-xl text-oxblood">
                        ${perMonth}
                        <span className="text-[11px] font-sans text-ink/50">/mo {CURRENCY}</span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label} className="border-t border-oxblood/10">
                  <td className="py-3 pr-3 text-[13px] text-ink/85">{row.label}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      {v === true ? (
                        <Check className="mx-auto h-4 w-4 text-oxblood" />
                      ) : v === false ? (
                        <Minus className="mx-auto h-4 w-4 text-ink/25" />
                      ) : (
                        <span className="text-[12px] font-medium text-ink/80">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-oxblood/10">
                <td className="py-3 pr-3" />
                {PLANS.map((p) => (
                  <td key={p.key} className="px-2 py-3 text-center">
                    <Link
                      href={`/signup?plan=${p.key}`}
                      className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        p.featured
                          ? "bg-oxblood text-cream hover:bg-oxblood/90"
                          : "border border-oxblood/30 text-oxblood hover:bg-oxblood/5"
                      }`}
                    >
                      Start trial
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <a
            href="mailto:hello.replyora@gmail.com?subject=More%20than%208%20clients"
            className="mt-4 block w-full rounded-xl border border-oxblood/20 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:bg-oxblood/5"
          >
            Need more than 8 clients? Contact us
          </a>
        </div>
      </div>
    </div>
  );
}
