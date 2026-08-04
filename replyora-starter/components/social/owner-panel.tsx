"use client";

import { useState, useTransition } from "react";
import { Crown, RotateCcw } from "lucide-react";

import {
  resetOwnerAccountAction,
  switchAccountTypeAction,
} from "@/app/(social)/owner-actions";
import type { SocialPlan } from "@/lib/social/plans";

/** Owner-only floating panel — switch account type + reset own demo data. */
export function OwnerPanel({ accountType }: { accountType: SocialPlan | null }) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {open && (
        <div className="mb-3 w-64 rounded-2xl border border-oxblood/20 bg-white p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-oxblood">
            Owner mode — all access
          </p>
          <p className="mt-1 text-[11px] text-ink/80">
            Currently:{" "}
            <b className="capitalize text-ink">{accountType ?? "not set"}</b>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["personal", "agency"] as SocialPlan[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => switchAccountTypeAction(t))}
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] capitalize disabled:opacity-60 ${
                  accountType === t
                    ? "bg-oxblood text-cream"
                    : "border border-ink/20 text-ink/85 hover:border-oxblood"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-ink/10 pt-3">
            {confirmReset ? (
              <div>
                <p className="text-[11px] font-medium text-rose-700">
                  Delete all your demo data and re-run onboarding?
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => resetOwnerAccountAction())}
                    className="rounded-full bg-rose-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                  >
                    Yes, reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:text-rose-700"
              >
                <RotateCcw className="h-3 w-3" /> Reset my account
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
      >
        <Crown className="h-3.5 w-3.5" /> Owner
      </button>
    </div>
  );
}
