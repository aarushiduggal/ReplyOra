"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Loader2, Check, Power } from "lucide-react";

import { setClientChatboxAction } from "@/app/(social)/clients/[id]/chatbox/actions";

/** Full-page card shown when this client's chatbox is OFF — one click enables it. */
export function ChatboxEnableCard({
  clientId,
  clientName,
  priceNote,
}: {
  clientId: string;
  clientName: string;
  priceNote: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-oxblood/15 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-oxblood/10">
        <MessageSquare className="h-6 w-6 text-oxblood" />
      </div>
      <h2 className="mt-4 font-display text-2xl text-oxblood">
        Turn on the AI website chatbox
      </h2>
      <p className="mt-2 text-sm text-ink/75">
        Add an on-brand assistant to{" "}
        <span className="font-semibold text-ink">{clientName}</span>&apos;s website that
        answers FAQs, captures leads and books enquiries 24/7 — trained on their business.
      </p>
      <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-[13px] text-ink/80">
        {[
          "Its own embed snippet + public key",
          "Knowledge base you control per client",
          "Leads flow straight into the workspace",
        ].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-roseink" />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setClientChatboxAction(clientId, true))}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-oxblood px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-oxblood/90 disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
        Enable chatbox for this client
      </button>
      <p className="mt-3 text-xs text-ink/55">{priceNote}</p>
    </div>
  );
}

/** Compact bar shown ABOVE the live chatbox workspace — status + disable. */
export function ChatboxLiveBar({
  clientId,
  priceNote,
}: {
  clientId: string;
  priceNote: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxblood/15 bg-oat/30 px-4 py-3">
      <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        Chatbox is live for this client
        <span className="text-ink/55">· {priceNote}</span>
      </p>
      {confirm ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setClientChatboxAction(clientId, false))}
            className="rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-70"
          >
            {pending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
            Yes, turn off
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 hover:border-rose hover:text-roseink"
        >
          <Power className="h-3 w-3" /> Disable
        </button>
      )}
    </div>
  );
}
