import {
  getCalls,
  getOnboarding,
  getTickets,
  listClients,
} from "@/lib/admin/data";
import { ServiceBoard } from "@/components/admin/service-board";

export default async function AdminServicePage() {
  const clients = await listClients();
  const nameById = new Map(clients.map((c) => [c.id, c.name]));
  const name = (id: string) => nameById.get(id) ?? "Client";

  const onboarding = getOnboarding().map((o) => ({
    clientId: o.clientId,
    clientName: name(o.clientId),
    tasks: o.tasks,
  }));
  const tickets = getTickets().map((t) => ({
    id: t.id,
    clientName: name(t.clientId),
    type: t.type,
    title: t.title,
    status: t.status,
    feeAud: t.feeAud,
  }));
  const calls = getCalls().map((c) => ({
    id: c.id,
    clientName: name(c.clientId),
    cadenceDays: c.cadenceDays,
    dueAt: c.dueAt,
    status: c.status,
    notes: c.notes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Service delivery</h1>
        <p className="mt-1 text-sm text-ink/60">
          Run the done-for-you model — onboarding, updates/retrains, and
          performance calls.
        </p>
      </div>
      <ServiceBoard onboarding={onboarding} tickets={tickets} calls={calls} />
    </div>
  );
}
