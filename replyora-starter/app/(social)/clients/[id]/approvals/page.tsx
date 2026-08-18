import { notFound } from "next/navigation";
import { ApprovalsWorkspace } from "@/components/social/approvals/approvals-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import {
  getClientApprovals,
  type ApprovalStatus,
  type ChangeResolution,
} from "@/lib/social/approvals";
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
  // With a real database configured, an id that resolves to nothing is either
  // another workspace's client or simply gone — either way it is not found, and
  // rendering a placeholder shell for it was misleading. Local/mock dev has no
  // DATABASE_URL, so the built-in demo client keeps working there.
  if (!client && process.env.DATABASE_URL) notFound();
  const name = client?.name ?? sampleName(id);

  const approvals: Record<string, ApprovalStatus> = {};
  const notes: Record<string, string | null> = {};
  const replies: Record<string, string | null> = {};
  const resolutions: Record<string, ChangeResolution | null> = {};
  for (const [postId, a] of approvalMap) {
    approvals[postId] = a.status;
    notes[postId] = a.clientNote;
    replies[postId] = a.agencyReply;
    resolutions[postId] = a.resolution;
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
      replies={replies}
      resolutions={resolutions}
      portalUrl={portalUrl}
    />
  );
}
