"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Layers,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";

import { enterAsAction } from "@/app/admin/actions";
import {
  adminSetAgencyAddonsAction,
  adminSetAgencyPlanAction,
} from "@/app/admin/workspaces/[id]/actions";
import type { AgencyDetail } from "@/lib/admin/overview";
import type { SocialAddons, SocialPlan } from "@/lib/social/plans";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

/** Monthly price for a plan + add-ons (mirrors lib/admin/overview.mrrFor). */
function mrrFor(accountType: SocialPlan, addons: SocialAddons): number {
  const base = accountType === "agency" ? 200 : 50;
  return base + (addons.chatbox ? 20 : 0) + (addons.reports ? 15 : 0);
}

const STATUS = ["trialing", "active", "past_due", "canceled"] as const;
const STATUS_PILL: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  trialing: "bg-amber-100 text-amber-800",
  past_due: "bg-rose-100 text-rose-800",
  canceled: "bg-ink/10 text-ink/60",
};

export function AgencyDetail({ agency }: { agency: AgencyDetail }) {
  const [accountType, setAccountType] = useState<SocialPlan>(agency.accountType);
  const [status, setStatus] = useState<string>(agency.status);
  const [addons, setAddons] = useState<SocialAddons>(agency.addons);
  const [, start] = useTransition();

  const mrr = mrrFor(accountType, addons);
  const dirtyPlan = accountType !== agency.accountType || status !== agency.status;

  function savePlan() {
    start(() => adminSetAgencyPlanAction(agency.id, accountType, status));
  }
  function toggleAddon(key: keyof SocialAddons) {
    const next = { ...addons, [key]: !addons[key] };
    setAddons(next);
    start(() => adminSetAgencyAddonsAction(agency.id, next));
  }

  const tiles = [
    { icon: Users, label: "Brands", value: String(agency.brands) },
    { icon: Sparkles, label: "Posts / mo", value: String(agency.postsThisMonth) },
    { icon: CreditCard, label: "MRR", value: money(mrr) },
    {
      icon: Layers,
      label: "Client limit",
      value: accountType === "agency" ? "10" : "1",
    },
  ];

  return (
    <div className="space-y-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70 hover:text-oxblood"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Command center
      </Link>

      {/* Identity + primary action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-ink">{agency.name}</h1>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[status] ?? ""}`}>
              {status === "past_due" ? "past due" : status}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/70">
            {agency.ownerName} · {agency.ownerEmail}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/50">
            {accountType} · joined {agency.createdAt.slice(0, 10)}
            {agency.trialEndsInDays !== null && ` · trial ends in ${agency.trialEndsInDays}d`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => start(() => enterAsAction(agency.id))}
          className="inline-flex items-center gap-2 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
        >
          <LogIn className="h-3.5 w-3.5" /> Manage in dashboard
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-oxblood/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">{t.label}</p>
              <t.icon className="h-3.5 w-3.5 text-oxblood/60" />
            </div>
            <p className="mt-1.5 font-display text-2xl text-oxblood">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan control */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Plan</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Account type</span>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as SocialPlan)}
                className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-oxblood"
              >
                <option value="personal">Personal ($49)</option>
                <option value="studio">Studio ($79)</option>
                <option value="agency">Agency ($249)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-oxblood"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s === "past_due" ? "past due" : s}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={!dirtyPlan}
            onClick={savePlan}
            className="mt-3 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Save plan
          </button>
        </div>

        {/* Add-ons control */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">Add-ons</h2>
          <div className="mt-3 space-y-2">
            {([
              { key: "chatbox" as const, label: "Website chatbox", price: "+$39/mo AUD" },
            ]).map((a) => {
              const on = addons[a.key];
              return (
                <div key={a.key} className="flex items-center justify-between rounded-xl border border-ink/10 p-3">
                  <p className="text-sm font-semibold text-ink">
                    {a.label} <span className="text-[11px] font-medium text-ink/50">{a.price}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleAddon(a.key)}
                    aria-label={`${on ? "Disable" : "Enable"} ${a.label}`}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-oxblood" : "bg-ink/20"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-oxblood/10 pt-3 text-sm">
            <span className="text-ink/70">This agency's MRR</span>
            <span className="font-display text-lg text-oxblood">{money(mrr)}</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
          Brands ({agency.brandList.length})
        </h2>
        {agency.brandList.length === 0 ? (
          <p className="rounded-2xl border border-oxblood/10 bg-white p-4 text-sm text-ink/60">No brands yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-oxblood/10 bg-white">
            {agency.brandList.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-oxblood/5 px-4 py-3 last:border-0">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-oxblood/10 text-[11px] font-semibold text-oxblood">
                    {b.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-ink">{b.name}</span>
                </span>
                <span className="text-[11px] text-ink/50">added {b.createdAt.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-ink/45">
        Plan &amp; add-on changes are audited and apply to this agency immediately.
      </p>
    </div>
  );
}
