import { ChatboxWorkspace } from "@/components/social/chatbox/chatbox-workspace";
import { LockedSection } from "@/components/social/locked-section";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { entitlementsFor } from "@/lib/social/plans";
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
  const [client, billing] = await Promise.all([
    getClient(id),
    getWorkspaceBilling(),
  ]);
  const name = client?.name ?? sampleName(id);

  // Plan gate: the website chatbox is a paid add-on.
  const ent = entitlementsFor(billing.accountType, billing.addons);
  if (!ent.chatbox) {
    return (
      <LockedSection
        title="Website chatbox isn't on your plan"
        description="Add the chatbox to capture leads from each client's website with an on-brand assistant."
        addonLabel="Chatbox add-on"
        priceLabel="+$39/mo AUD"
      />
    );
  }

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
