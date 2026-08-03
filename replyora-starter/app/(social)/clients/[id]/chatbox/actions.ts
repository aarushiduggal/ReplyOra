"use server";

import { revalidatePath } from "next/cache";

import {
  addKnowledge,
  deleteKnowledge,
  saveClientAssistant,
  type ClientAssistant,
} from "@/lib/social/chatbox";

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
