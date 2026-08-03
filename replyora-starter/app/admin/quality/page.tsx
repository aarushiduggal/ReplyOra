import { getKnowledgeGaps, listClients } from "@/lib/admin/data";
import { QualityBoard } from "@/components/admin/quality-board";

export default async function AdminQualityPage() {
  const clients = await listClients();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const name = (id: string) => byId.get(id)?.name ?? "Client";

  const gaps = getKnowledgeGaps()
    .map((g) => ({
      clientId: g.clientId,
      clientName: name(g.clientId),
      question: g.question,
      count: g.count,
    }))
    .sort((a, b) => b.count - a.count);

  const flagged = clients
    .filter((c) => c.unansweredCount >= 3)
    .sort((a, b) => b.unansweredCount - a.unansweredCount)
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      plan: c.plan,
      unansweredCount: c.unansweredCount,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Assistant quality</h1>
        <p className="mt-1 text-sm text-ink/60">
          Assistants that keep hitting questions they can&apos;t answer — close
          the gaps to keep every client&apos;s assistant sharp.
        </p>
      </div>
      <QualityBoard gaps={gaps} flagged={flagged} />
    </div>
  );
}
