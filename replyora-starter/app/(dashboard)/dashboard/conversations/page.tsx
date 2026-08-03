import Link from "next/link";
import { ChevronRight, Hand, MessagesSquare } from "lucide-react";

import { listConversations } from "@/lib/data/conversations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConversationStatusBadge } from "@/components/dashboard/status-badges";
import { formatDateTime } from "@/lib/format";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const empty = (await searchParams).empty === "1";
  const conversations = empty ? [] : await listConversations();

  return (
    <div>
      <PageHeader
        title="Conversations"
        description="Every chat your assistant has had, with full transcripts."
      />
      <div className="p-6">
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Once your widget is live, every visitor chat lands here with its full transcript."
            actionLabel="Get your install snippet"
            actionHref="/dashboard/install"
          />
        ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/conversations/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-oat/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink">
                      {c.preview}
                    </p>
                    {c.capturedLead && (
                      <Badge variant="success">Lead</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.messageCount} messages · {c.pageUrl.replace("https://", "")}
                  </p>
                </div>
                {c.handledBy === "human" && (
                  <Badge variant="warning" className="hidden gap-1 sm:inline-flex">
                    <Hand className="h-3 w-3" /> Human
                  </Badge>
                )}
                <div className="hidden text-right lg:block">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(c.lastMessageAt)}
                  </p>
                </div>
                <ConversationStatusBadge status={c.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
