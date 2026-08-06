"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { addClient, deleteClient, listClients } from "@/lib/social/clients";
import { getWorkspaceBilling } from "@/lib/social/billing";
import { entitlementsFor } from "@/lib/social/plans";

/**
 * "+ ADD CLIENT" — create a client row in the agency's workspace, then open
 * its Overview. Workspace is resolved server-side inside addClient().
 * Enforces the plan's client limit server-side (never trusts the client).
 */
export async function createClientAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/clients");

  const [billing, existing] = await Promise.all([
    getWorkspaceBilling(),
    listClients(),
  ]);
  const ent = entitlementsFor(billing.accountType, billing.addons);
  if (existing.length >= ent.maxClients) {
    // Over the plan's client limit — refuse and surface the upsell.
    redirect("/clients?limit=reached");
  }

  const client = await addClient(name);
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

/** Remove a client and all of its data. Scoped to the agency's workspace. */
export async function deleteClientAction(clientId: string): Promise<void> {
  await deleteClient(clientId);
  revalidatePath("/clients");
}
