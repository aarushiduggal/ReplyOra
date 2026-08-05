"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { animate } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Option E — build-your-plan: toggle what you need, price updates live. */

const BASE = 50;
const ADDONS = [
  {
    id: "chatbox",
    label: "Website chatbox",
    desc: "A warm AI assistant answering your site 24/7",
    price: 20,
  },
  {
    id: "agency",
    label: "Up to 10 client brands",
    desc: "Client portal, approvals & branded invoicing",
    price: 150,
  },
  {
    id: "reports",
    label: "Branded performance reports",
    desc: "Send polished monthly reports to clients",
    price: 15,
  },
] as const;

type Id = (typeof ADDONS)[number]["id"];

export function PricingBuilder() {
  const [on, setOn] = useState<Record<Id, boolean>>({
    chatbox: false,
    agency: false,
    reports: false,
  });

  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const monthly = BASE + ADDONS.reduce((s, a) => s + (on[a.id] ? a.price : 0), 0);
  // Annual is 11 months — one month free.
  const total = cycle === "monthly" ? monthly : monthly * 11;
  const effectiveMonthly = Math.round((monthly * 11) / 12);

  const [shown, setShown] = useState(total);
  useEffect(() => {
    const c = animate(shown, total, {
      duration: 0.4,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-3xl border border-oxblood/15 bg-white p-8 shadow-sm">
        {/* billing cycle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-full border border-oxblood/15 bg-oat/60 p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  cycle === c ? "bg-oxblood text-cream" : "text-ink/60 hover:text-oxblood"
                }`}
              >
                {c}
                {c === "yearly" && (
                  <span
                    className={
                      cycle === c
                        ? "ml-1 text-[10px] text-cream/80"
                        : "ml-1 text-[10px] text-rose"
                    }
                  >
                    1 month free
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl text-oxblood">Personal</p>
            <p className="text-sm text-ink/55">Your base plan · 1 brand</p>
          </div>
          <p className="font-display text-2xl text-wine">${BASE}</p>
        </div>

        <div className="my-6 h-px bg-oxblood/10" />

        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">
          Add what you need
        </p>
        <div className="space-y-2.5">
          {ADDONS.map((a) => {
            const active = on[a.id];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setOn((o) => ({ ...o, [a.id]: !o[a.id] }))}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  active
                    ? "border-oxblood bg-oxblood/5"
                    : "border-oxblood/12 hover:bg-oat/40"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    active ? "border-oxblood bg-oxblood text-cream" : "border-ink/25"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{a.label}</span>
                  <span className="block text-[12px] text-ink/55">{a.desc}</span>
                </span>
                <span className="text-sm font-semibold text-oxblood">+${a.price}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-end justify-between rounded-2xl bg-oxblood px-5 py-4 text-cream">
          <span className="text-sm text-cream/80">Your price</span>
          <div className="text-right">
            <span className="font-display text-4xl leading-none">
              ${shown.toLocaleString("en-AU")}
              <span className="font-sans text-base text-cream/70">
                /{cycle === "monthly" ? "mo" : "yr"}
              </span>
            </span>
            {cycle === "yearly" && (
              <p className="mt-1 text-[11px] text-cream/70">
                ≈ ${effectiveMonthly}/mo · 1 month free
              </p>
            )}
          </div>
        </div>

        <Button asChild size="lg" className="mt-5 w-full rounded-full">
          <Link href="/signup">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-ink/50">
        Free 7-day trial · no card · change add-ons anytime
      </p>
    </div>
  );
}
