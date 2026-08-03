import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { PageShell } from "@/components/social/page-shell";
import { SectionHeader } from "@/components/social/section-header";
import { SAMPLE_CLIENTS } from "@/components/social/portal-nav";

export default function ClientsPage() {
  return (
    <PageShell>
      <SectionHeader num="01" label="Clients" />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-oxblood">Your clients</h2>
          <p className="mt-2 max-w-md text-sm text-ink/70">
            Each client is a workspace — a feed, a calendar, a report, an invoice.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-oxblood/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood transition-colors hover:bg-oxblood hover:text-cream"
        >
          <Plus className="h-3.5 w-3.5" /> New client
        </button>
      </div>

      <div className="mt-10 border-y border-ink/10">
        {SAMPLE_CLIENTS.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="group flex items-center justify-between border-b border-ink/10 py-6 last:border-0"
          >
            <div>
              <p className="font-display text-2xl text-ink transition-colors group-hover:text-oxblood">
                {c.name}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink/55">
                {c.handle} &nbsp;·&nbsp; {c.platforms}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-ink/40 transition-all group-hover:translate-x-1 group-hover:text-oxblood" />
          </Link>
        ))}
      </div>

      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink/50">
        Sample roster · wiring to your Neon clients table next
      </p>
    </PageShell>
  );
}
