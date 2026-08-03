import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getConversation } from "@/lib/data/conversations";
import { getWorkspace } from "@/lib/data/workspace";
import { hasFeature } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";
import {
  ConversationStatusBadge,
} from "@/components/dashboard/status-badges";
import { ConversationSidebar } from "@/components/dashboard/conversation-sidebar";
import { ConversationThread } from "@/components/dashboard/conversation-thread";
import { formatDateTime } from "@/lib/format";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [conversation, workspace] = await Promise.all([
    getConversation(id),
    getWorkspace(),
  ]);
  if (!conversation) notFound();
  const canHandoff = hasFeature(workspace.plan, "humanHandoff");

  return (
    <div>
      <div className="border-b border-border bg-card px-6 py-5">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-oxblood"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to conversations
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl text-oxblood">
            {conversation.preview}
          </h1>
          <ConversationStatusBadge status={conversation.status} />
          {conversation.capturedLead && (
            <Badge variant="success">Lead captured</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Started {formatDateTime(conversation.startedAt)} · Visitor{" "}
          {conversation.visitorId}
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Transcript + live human-handoff composer */}
        <ConversationThread
          conversationId={conversation.id}
          initialMessages={conversation.messages}
          initialHandledBy={conversation.handledBy}
          canHandoff={canHandoff}
        />

        {/* Interactive sidebar: details, convert, notes */}
        <ConversationSidebar conversation={conversation} />
      </div>
    </div>
  );
}
