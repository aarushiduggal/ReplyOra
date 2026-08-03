import { ApprovalsWorkspace } from "@/components/social/approvals/approvals-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { getClientApprovals, type ApprovalStatus } from "@/lib/social/approvals";
import { makeShareToken } from "@/lib/social/portal";

export const dynamic = "force-dynamic";

export default async function ClientApprovalsPage({
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
  const notes: Record<string, string | null> = {};
  for (const [postId, a] of approvalMap) {
    approvals[postId] = a.status;
    notes[postId] = a.clientNote;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(/\/$/, "");
  const portalUrl = `${appUrl}/portal/${makeShareToken(id)}`;

  return (
    <ApprovalsWorkspace
      clientId={id}
      clientName={name}
      posts={posts}
      approvals={approvals}
      notes={notes}
      portalUrl={portalUrl}
    />
  );
}
