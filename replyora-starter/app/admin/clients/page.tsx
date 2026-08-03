import {
  isOverLimit,
  listClients,
  messagesCap,
  mrrForClient,
} from "@/lib/admin/data";
import { ClientsTable, type ClientRow } from "@/components/admin/clients-table";

export default async function AdminClientsPage() {
  const clients = await listClients();
  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    ownerName: c.ownerName,
    ownerEmail: c.ownerEmail,
    plan: c.plan,
    status: c.status,
    paused: c.paused,
    mrr: mrrForClient(c),
    messagesUsed: c.messagesUsed,
    messagesCap: messagesCap(c.plan),
    overLimit: isOverLimit(c),
    signupAt: c.signupAt,
    lastActiveAt: c.lastActiveAt,
    setupStatus: c.setupStatus,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Clients</h1>
        <p className="mt-1 text-sm text-ink/60">
          {clients.length} workspaces. Search, sort, and drill into any one to
          manage it on their behalf.
        </p>
      </div>
      <ClientsTable rows={rows} />
    </div>
  );
}
