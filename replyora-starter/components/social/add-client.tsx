"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Plus, X } from "lucide-react";

import { createClientAction } from "@/app/(social)/clients/actions";

/**
 * "+ ADD CLIENT" button + name dialog. On submit the server action creates the
 * client row in Neon and redirects to its Overview.
 *
 * When the workspace is at its plan's client limit, the button becomes an
 * upsell that explains the limit instead of opening the create form.
 */
export function AddClient({
  atLimit = false,
  maxClients,
}: {
  atLimit?: boolean;
  maxClients?: number;
}) {
  const [open, setOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  if (atLimit) {
    const agencyMax = maxClients && maxClients >= 10;
    return (
      <>
        <button
          type="button"
          onClick={() => setLimitOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood transition-colors hover:bg-oxblood/5"
        >
          <Lock className="h-3.5 w-3.5" /> Add client
        </button>
        {limitOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
            onClick={() => setLimitOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
                <Lock className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-2xl text-oxblood">
                {agencyMax ? "That's your 10-client max" : "Client limit reached"}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink/75">
                {agencyMax
                  ? "Managing more than 10 brands? Get in touch and we'll unlock a higher tier for you."
                  : `Your plan includes ${maxClients ?? 1} client. Upgrade to Agency to manage more brands from one workspace.`}
              </p>
              {agencyMax ? (
                <a
                  href="mailto:hello@replyora.net?subject=More%20than%2010%20clients"
                  className="mt-6 inline-flex rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
                >
                  Contact us
                </a>
              ) : (
                <Link
                  href="/settings?tab=plan"
                  className="mt-6 inline-flex rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
                >
                  Upgrade plan
                </Link>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" /> Add client
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
                <span className="text-oxblood">( + )</span> New client
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink/80 transition-colors hover:text-oxblood"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 font-display text-2xl text-oxblood">Add a client</h3>
            <p className="mt-2 text-sm font-medium text-ink/85">
              Name the brand you&apos;re managing. You can add handles, pillars and
              billing inside their workspace.
            </p>

            <form action={createClientAction} className="mt-5">
              <input
                name="name"
                required
                autoFocus
                placeholder="e.g. Bloom Hair Studio"
                className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/60 focus:border-oxblood"
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-oxblood px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
              >
                Create &amp; open workspace
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
