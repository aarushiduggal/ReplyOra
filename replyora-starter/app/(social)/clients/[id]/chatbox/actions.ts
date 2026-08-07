"use server";

import { revalidatePath } from "next/cache";

import {
  addKnowledge,
  deleteKnowledge,
  saveClientAssistant,
  type ClientAssistant,
} from "@/lib/social/chatbox";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { setClientChatbox } from "@/lib/social/client-detail";
import { syncChatboxBilling } from "@/lib/social/chatbox-billing";

/**
 * Turn this client's website chatbox on/off. Per-site billing: flipping the
 * flag reconciles the workspace's chatbox subscription-item quantity (a no-op
 * until Stripe is live). $39/mo AUD per enabled site; Agency's first is free.
 */
export async function setClientChatboxAction(
  clientId: string,
  enabled: boolean,
): Promise<void> {
  await setClientChatbox(clientId, enabled);
  try {
    await syncChatboxBilling(await getCurrentWorkspaceId());
  } catch {
    // Never let a Stripe hiccup block the toggle — billing reconciles later.
  }
  revalidatePath(`/clients/${clientId}/chatbox`);
}

export async function saveAssistantAction(
  clientId: string,
  patch: Partial<Omit<ClientAssistant, "id" | "clientId" | "publicKey">>,
): Promise<void> {
  await saveClientAssistant(clientId, patch);
  revalidatePath(`/clients/${clientId}/chatbox`);
}

export async function addKnowledgeAction(
  clientId: string,
  input: { type: string; title: string; preview: string },
): Promise<void> {
  await addKnowledge(clientId, input);
  revalidatePath(`/clients/${clientId}/chatbox`);
}

export async function deleteKnowledgeAction(
  clientId: string,
  id: string,
): Promise<void> {
  await deleteKnowledge(clientId, id);
  revalidatePath(`/clients/${clientId}/chatbox`);
}
