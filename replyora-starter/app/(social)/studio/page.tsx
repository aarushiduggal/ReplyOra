import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageShell } from "@/components/social/page-shell";
import { SectionHeader } from "@/components/social/section-header";
import { listClients } from "@/lib/social/clients";

export const dynamic = "force-dynamic";

export default async function StudioLauncherPage() {
  const clients = await listClients();
  return (
    <PageShell>
      <SectionHeader num="04" label="Studio" />
      <h2 className="mt-6 font-display text-3xl text-oxblood">Batch content studio</h2>
      <p className="mt-2 max-w-md text-sm font-medium text-ink/90">
        Pick a client to batch-create posts — generate captions, arrange assets,
        and save drafts to their Grid &amp; Calendar.
      </p>

      {clients.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-medium text-ink/80">
          Add a client first, then open their Studio.
        </p>
      ) : (
        <div className="mt-8 border-t border-ink/10">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}/studio`}
              className="group flex items-center justify-between border-b border-ink/10 py-4"
            >
              <span className="font-display text-xl text-ink transition-colors group-hover:text-oxblood">
                {c.name}
              </span>
              <ArrowRight className="h-4 w-4 text-ink/60 transition-all group-hover:translate-x-1 group-hover:text-oxblood" />
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
