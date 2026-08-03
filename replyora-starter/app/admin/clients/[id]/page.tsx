import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePlatformAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit";
import { getClient, mrrForClient, messagesCap, isOverLimit } from "@/lib/admin/data";
import { adminGetBusinessProfile, adminListKnowledge } from "@/lib/admin/store";
import { ClientManager } from "@/components/admin/client-manager";

function money(n: number) {
  return `$${n.toLocaleString("en-AU")}`;
}
function date(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await requirePlatformAdmin();
  const client = await getClient(id);
  if (!client) notFound();

  // AUDIT: every staff view of a client's workspace is recorded.
  await logAdminAction({
    actorId: staff.userId,
    actorName: staff.name,
    workspaceId: client.id,
    workspaceName: client.name,
    action: "client.view",
    target: "detail",
  });

  const [kb, profile] = await Promise.all([
    adminListKnowledge(client.id),
    adminGetBusinessProfile(client.id),
  ]);

  const stats: { label: string; value: string; alert?: boolean }[] = [
    { label: "MRR", value: money(mrrForClient(client)) },
    {
      label: "Messages",
      value: `${client.messagesUsed.toLocaleString()} / ${messagesCap(client.plan).toLocaleString()}`,
      alert: isOverLimit(client),
    },
    { label: "KB pages", value: String(client.kbPagesUsed) },
    { label: "Unanswered", value: String(client.unansweredCount), alert: client.unansweredCount >= 8 },
    { label: "Signup", value: date(client.signupAt) },
    { label: "Last active", value: date(client.lastActiveAt) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-oxblood">
        <ArrowLeft className="h-4 w-4" /> All clients
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{client.name}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {client.ownerName}
            {client.ownerEmail ? ` · ${client.ownerEmail}` : ""} · {client.plan} ·{" "}
            <span className="capitalize">{client.paused ? "paused" : client.status.replace("_", " ")}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">{s.label}</p>
            <p className={`mt-0.5 text-lg ${s.alert ? "text-rose-600" : "text-ink"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {client.notes && (
        <div className="rounded-lg border border-amber-300/20 bg-amber-400/5 px-4 py-2 text-sm text-amber-100/80">
          {client.notes}
        </div>
      )}

      <ClientManager
        clientId={client.id}
        initialPlan={client.plan}
        initialStatus={client.status}
        paused={client.paused}
        initialNotes={client.notes}
        initialProfile={{
          industry: profile.industry ?? "",
          description: profile.description ?? "",
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          website: profile.website ?? "",
          address: profile.address ?? "",
        }}
        initialKnowledge={kb}
      />
    </div>
  );
}
