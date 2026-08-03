"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * First-run guide (1/2). Shows once per browser — points the agency owner to
 * Settings → Workspace + Client Billing before they start adding clients.
 */
const SEEN_KEY = "replyora_welcome_seen_v1";

export function WelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* localStorage unavailable — skip the guide */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function openSettings() {
    dismiss();
    router.push("/settings");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
          <span className="text-oxblood">( Guide )</span> 1 / 2
        </span>

        <h2 className="mt-4 font-display text-3xl text-oxblood">
          Welcome to replyora
        </h2>

        <p className="mt-3 text-sm font-medium leading-relaxed text-ink/90">
          Set up your account in{" "}
          <span className="font-semibold text-ink">Settings → Workspace</span> to
          add your agency name, logo and address — then open{" "}
          <span className="font-semibold text-ink">Client Billing</span> for your
          invoice defaults.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={openSettings}
            className="rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
          >
            Open Settings
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-ink/25 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-oxblood hover:text-oxblood"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
