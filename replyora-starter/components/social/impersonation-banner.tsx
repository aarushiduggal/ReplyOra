"use client";

import { useTransition } from "react";

import { exitImpersonationAction } from "@/app/admin/actions";

/** Persistent banner shown across the app while staff is impersonating. */
export function ImpersonationBanner({ workspaceName }: { workspaceName: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="sticky top-0 z-[70] flex items-center justify-center gap-3 bg-ink px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
      <span>
        Viewing <span className="text-cream">{workspaceName}</span> as staff
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => exitImpersonationAction())}
        className="rounded-full bg-white/20 px-3 py-1 transition-colors hover:bg-white/30 disabled:opacity-60"
      >
        Exit
      </button>
    </div>
  );
}
