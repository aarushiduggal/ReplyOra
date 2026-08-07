import { ChatboxWorkspace } from "@/components/social/chatbox/chatbox-workspace";
import {
  ChatboxEnableCard,
  ChatboxLiveBar,
} from "@/components/social/chatbox/chatbox-enable";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { currentEntitlements } from "@/lib/social/billing";
import { isClientChatboxEnabled } from "@/lib/social/client-detail";
import { CHATBOX_ADDON_PRICE, CURRENCY } from "@/lib/social/plans";
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
  const [client, { type }] = await Promise.all([
    getClient(id),
    currentEntitlements(),
  ]);
  const name = client?.name ?? sampleName(id);

  // Agency: the chatbox is INCLUDED for every client — always on, no enable
  // step, no charge. Personal & Studio: it's a $39/mo AUD add-on switched on
  // per client (per site).
  const isAgency = type === "agency";
  const priceNote = `$${CHATBOX_ADDON_PRICE}/mo ${CURRENCY} per site`;
  const enabled = isAgency || (await isClientChatboxEnabled(id));

  if (!enabled) {
    return (
      <ChatboxEnableCard clientId={id} clientName={name} priceNote={priceNote} />
    );
  }

  const [assistant, knowledge] = await Promise.all([
    getOrCreateClientAssistant(id, name),
    listKnowledge(id),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(/\/$/, "");
  const snippet = `<script src="${appUrl}/embed.js" data-key="${assistant.publicKey}"></script>`;

  return (
    <div className="space-y-4">
      {/* Agency has it included, so no disable/billing bar — just the workspace. */}
      {!isAgency && <ChatboxLiveBar clientId={id} priceNote={priceNote} />}
      <ChatboxWorkspace
        clientId={id}
        clientName={name}
        assistant={assistant}
        knowledge={knowledge}
        snippet={snippet}
      />
    </div>
  );
}
