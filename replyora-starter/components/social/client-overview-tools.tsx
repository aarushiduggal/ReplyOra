"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Settings2 } from "lucide-react";

import type { ClientDetail } from "@/lib/social/client-detail";
import { ClientEditModal, type Tab } from "@/components/social/client-edit-modal";

export interface SetupState {
  brandKit: boolean;
  pillars: boolean;
  invite: boolean;
  connected: boolean;
  assets: boolean;
  gridContent: boolean;
  calendar: boolean;
}

export function ClientOverviewTools({
  detail,
  setup,
}: {
  detail: ClientDetail;
  setup: SetupState;
}) {
  const [openTab, setOpenTab] = useState<Tab | null>(null);
  const base = `/clients/${detail.id}`;

  // Each checklist item is either a modal tab or a page link.
  const items: {
    label: string;
    done: boolean;
    tab?: Tab;
    href?: string;
  }[] = [
    { label: "Add brand kit (logo, colours, fonts)", done: setup.brandKit, tab: "Brand Kit" },
    { label: "Set up 3+ content pillars", done: setup.pillars, tab: "Pillars" },
    { label: "Invite client to their portal", done: setup.invite, tab: "Access" },
    { label: "Connect the social account", done: setup.connected, href: `${base}/integrations` },
    { label: "Upload assets to the library", done: setup.assets, href: `${base}/assets` },
    { label: "Place content on the grid", done: setup.gridContent, href: `${base}/grid` },
    { label: "Plan your first calendar posts", done: setup.calendar, href: `${base}/calendar` },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpenTab("Client Info")}
          className="inline-flex items-center gap-2 rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood transition-colors hover:bg-oxblood hover:text-cream"
        >
          <Settings2 className="h-3.5 w-3.5" /> Edit client
        </button>
        {!allDone && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
            Setup · {doneCount}/{items.length} done
          </span>
        )}
      </div>

      {!allDone && (
        <div className="mt-6 rounded-2xl border border-oxblood/15 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-oxblood/70">
            Finish client setup
          </p>
          <div className="mt-3 divide-y divide-ink/8">
            {items.map((it) => {
              const inner = (
                <div className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        it.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink/25"
                      }`}
                    >
                      {it.done && <Check className="h-3 w-3" />}
                    </span>
                    <span className={it.done ? "text-ink/50 line-through" : ""}>{it.label}</span>
                  </span>
                  {!it.done && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood">
                      {it.tab ? "Open" : "Go"} →
                    </span>
                  )}
                </div>
              );
              if (it.done) return <div key={it.label}>{inner}</div>;
              return it.tab ? (
                <button key={it.label} type="button" onClick={() => setOpenTab(it.tab!)} className="block w-full text-left">
                  {inner}
                </button>
              ) : (
                <Link key={it.label} href={it.href!} className="block">
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {openTab && (
        <ClientEditModal detail={detail} initialTab={openTab} onClose={() => setOpenTab(null)} />
      )}
    </>
  );
}
