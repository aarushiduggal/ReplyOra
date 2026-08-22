import { listWaitlist } from "@/lib/waitlist";
import { listInvites } from "@/lib/beta";
import {
  WaitlistTable,
  type InviteRow,
  type WaitlistRow,
} from "@/components/admin/waitlist-table";

/**
 * Staff view for running the closed beta: who's asked for access, who's been
 * invited, and which links are still live.
 */
export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const [signups, invites] = await Promise.all([listWaitlist(), listInvites()]);

  const rows: WaitlistRow[] = signups.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    company: s.company,
    role: s.role,
    clients: s.clients,
    note: s.note,
    source: s.source,
    status: s.status,
    inviteCode: s.inviteCode,
    createdAt: s.createdAt,
  }));

  const inviteRows: InviteRow[] = invites.map((i) => ({
    code: i.code,
    label: i.label,
    email: i.email,
    createdAt: i.createdAt,
    usedAt: i.usedAt,
    usedByEmail: i.usedByEmail,
    revokedAt: i.revokedAt,
  }));

  const betaCount = inviteRows.filter((i) => i.usedAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Beta &amp; waitlist</h1>
        <p className="mt-1 text-sm text-ink/60">
          Everyone who asked for access, and the invite links you&apos;ve handed
          out. Invite someone and they get 30 days of full access, free.
        </p>
      </div>
      <WaitlistTable rows={rows} invites={inviteRows} betaCount={betaCount} />
    </div>
  );
}
