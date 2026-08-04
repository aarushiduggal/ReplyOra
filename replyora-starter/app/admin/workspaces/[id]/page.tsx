import Link from "next/link";
import { notFound } from "next/navigation";

import { getWorkspaceDetail } from "@/lib/admin/social-data";
import { SectionHeader } from "@/components/social/section-header";
import { EnterAsButton } from "@/components/admin/enter-as-button";
import { USE_AUTHJS } from "@/lib/data/mode";

export const dynamic = "force-dynamic";

function money(cents: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    cents / 100,
  );
}

export default async function AdminWorkspaceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!USE_AUTHJS) notFound();
  const { id } = await params;
  const d = await getWorkspaceDetail(id);
  if (!d) notFound();

  const stats = [
    { label: "Clients", value: String(d.clientCount) },
    { label: "Posts", value: String(d.postCount) },
    { label: "Invoices", value: String(d.invoiceCount) },
    { label: "Invoiced", value: money(d.invoiceTotalCents) },
  ];

  return (
    <div>
      <Link
        href="/admin"
        className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70 hover:text-oxblood"
      >
        ← All workspaces
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionHeader num="01" label="Workspace" />
          <h1 className="mt-4 font-display text-3xl text-oxblood">{d.name}</h1>
          <p className="mt-1 text-sm font-medium text-ink/80">
            {d.ownerName ? `${d.ownerName} · ` : ""}
            {d.ownerEmail}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink/65">
            {d.accountType ?? "no type"} · {d.planStatus} · joined {d.createdAt.slice(0, 10)}
          </p>
        </div>
        <EnterAsButton workspaceId={d.id} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-ink/10 px-4 py-3">
            <p className="font-display text-2xl text-oxblood">{s.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
          Clients ({d.clients.length})
        </p>
        {d.clients.length === 0 ? (
          <p className="mt-3 text-[12px] text-ink/60">No clients yet.</p>
        ) : (
          <div className="mt-3 border-t border-ink/10">
            {d.clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-ink/10 py-3"
              >
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-[11px] text-ink/60">{c.createdAt.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
