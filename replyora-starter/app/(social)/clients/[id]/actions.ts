"use server";

import { revalidatePath } from "next/cache";

import {
  updateClientDetail,
  savePillars,
  createInvite,
  type ClientDetailPatch,
} from "@/lib/social/client-detail";

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function updateClientDetailAction(
  clientId: string,
  patch: ClientDetailPatch,
): Promise<void> {
  await updateClientDetail(clientId, patch);
  revalidate(clientId);
}

export async function savePillarsAction(
  clientId: string,
  pillars: { name: string; colour?: string | null }[],
): Promise<void> {
  await savePillars(clientId, pillars);
  revalidate(clientId);
}

export async function createInviteAction(
  clientId: string,
  input: { recipient?: string; email?: string; role?: string; expiresDays?: number },
): Promise<{ token: string } | null> {
  const res = await createInvite(clientId, input);
  revalidate(clientId);
  return res;
}
