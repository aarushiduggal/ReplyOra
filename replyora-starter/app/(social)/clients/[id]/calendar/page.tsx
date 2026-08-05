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
  const [client, posts, approvalMap] = await Promise.all([
    getClient(id),
    listClientPosts(id),
    getClientApprovals(id),
  ]);
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
