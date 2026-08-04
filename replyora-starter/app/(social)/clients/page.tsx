import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { listClients } from "@/lib/social/clients";
import { PageShell } from "@/components/social/page-shell";
import { SectionHeader } from "@/components/social/section-header";
import { AddClient } from "@/components/social/add-client";
import { GuideTrigger } from "@/components/social/guide";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [user, clients] = await Promise.all([getCurrentUser(), listClients()]);
  const count = clients.length;

  return (
    <PageShell>
      {/* Header row: "( 01 ) CLIENTS"  ·  N active · Name · + ADD CLIENT */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <SectionHeader num="01" label="Clients" />
          <GuideTrigger pageKey="clients" />
        </span>
        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span>{count} active</span>
          <span className="text-ink/60">·</span>
          <span className="text-ink">{user.fullName}</span>
          <AddClient />
        </div>
      </div>

      {count === 0 ? (
        <div className="mt-14 rounded-2xl border border-dashed border-ink/25 px-8 py-16 text-center">
          <h2 className="font-display text-3xl text-oxblood">Add your first client</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm font-medium text-ink/85">
            Every client gets its own workspace — a feed, a calendar, approvals,
            reports and invoices. Add one to begin.
          </p>
          <div className="mt-6 flex justify-center">
            <AddClient />
          </div>
        </div>
      ) : (
        <div className="mt-12 border-t border-ink/10">
          {clients.map((c) => {
            const initial = c.name.trim().charAt(0).toUpperCase() || "?";
            const pillars =
              c.pillarCount > 0
                ? `${c.pillarCount} pillar${c.pillarCount === 1 ? "" : "s"}`
                : "No pillars yet";
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="group flex items-center justify-between border-b border-ink/10 py-6"
              >
                <div className="flex items-center gap-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood/10 font-display text-xl text-oxblood">
                    {initial}
                  </span>
                  <div>
                    <p className="font-display text-2xl text-ink transition-colors group-hover:text-oxblood">
                      {c.name}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
                      {pillars}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink/60 transition-all group-hover:translate-x-1 group-hover:text-oxblood" />
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
