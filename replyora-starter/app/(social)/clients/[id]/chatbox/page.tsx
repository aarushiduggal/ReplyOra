import { ChatboxWorkspace } from "@/components/social/chatbox/chatbox-workspace";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import {
  getOrCreateClientAssistant,
  listKnowledge,
} from "@/lib/social/chatbox";

export const dynamic = "force-dynamic";

export default async function ClientChatboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  const name = client?.name ?? sampleName(id);

  const [assistant, knowledge] = await Promise.all([
    getOrCreateClientAssistant(id, name),
    listKnowledge(id),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(/\/$/, "");
  const snippet = `<script src="${appUrl}/embed.js" data-key="${assistant.publicKey}"></script>`;

  return (
    <ChatboxWorkspace
      clientId={id}
      clientName={name}
      assistant={assistant}
      knowledge={knowledge}
      snippet={snippet}
    />
  );
}
