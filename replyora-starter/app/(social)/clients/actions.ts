"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { addClient } from "@/lib/social/clients";

/**
 * "+ ADD CLIENT" — create a client row in the agency's workspace, then open
 * its Overview. Workspace is resolved server-side inside addClient().
 */
export async function createClientAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const client = await addClient(name);
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}
