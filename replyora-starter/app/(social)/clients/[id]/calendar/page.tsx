import { notFound } from "next/navigation";
import { CalendarWorkspace } from "@/components/social/calendar/calendar-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { getClientApprovals, type ApprovalStatus } from "@/lib/social/approvals";
import { HAS_PUBLISHER } from "@/lib/social/publish";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fault-tolerant like the Grid: a single flaky read (transient Neon error)
  // must never crash the whole Calendar.
  const [client, posts, approvalMap] = await Promise.all([
    getClient(id).catch(() => null),
    listClientPosts(id).catch(() => []),
    getClientApprovals(id).catch(() => new Map()),
  ]);
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
  const name = client?.name ?? sampleName(id);

  const approvals: Record<string, ApprovalStatus> = {};
  for (const [postId, a] of approvalMap) approvals[postId] = a.status;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <CalendarWorkspace
      clientId={id}
      clientName={name}
      posts={posts}
      approvals={approvals}
      todayISO={todayISO}
      publishReady={HAS_PUBLISHER}
    />
  );
}
