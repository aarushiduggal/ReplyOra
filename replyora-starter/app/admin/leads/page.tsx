import { listAllLeads } from "@/lib/admin/data";
import { LeadsTable, type AdminLeadRow } from "@/components/admin/leads-table";

export default async function AdminLeadsPage() {
  const leads = await listAllLeads();
  const rows: AdminLeadRow[] = leads.map((l) => ({
    id: l.id,
    workspaceId: l.workspaceId,
    clientName: l.clientName,
    name: l.name,
    email: l.email,
    phone: l.phone,
    intent: l.intent,
    status: l.status,
    createdAt: l.createdAt,
  }));

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Leads</h1>
        <p className="mt-1 text-sm text-ink/60">
          Every lead captured by a client&apos;s chat assistant, across all
          workspaces. {rows.length} total
          {newCount > 0 ? ` · ${newCount} new` : ""}.
        </p>
      </div>
      <LeadsTable rows={rows} />
    </div>
  );
}
