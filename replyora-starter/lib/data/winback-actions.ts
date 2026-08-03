"use server";

/**
 * Win-Back Agent — server-action write boundary.
 * Client components import from here (never the accessor module directly) so
 * server-only code stays out of the client bundle. Mirrors growth-actions.ts.
 */

import { revalidatePath } from "next/cache";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { getImpersonation } from "@/lib/admin/access";
import {
  regenerateWinbackDraft,
  setWinbackDraft,
  setWinbackStatus,
} from "@/lib/data/winback";

const PATH = "/dashboard/winback";

async function guard() {
  const imp = await getImpersonation();
  if (imp?.mode === "view") {
    throw new Error(
      "Read-only: you're viewing as this client. Switch to Manage to make changes.",
    );
  }
  await getCurrentWorkspaceId();
}

/** Approve the (possibly edited) draft and "send" the win-back message. */
export async function approveWinback(id: string, message: string): Promise<void> {
  await guard();
  if (message.trim()) setWinbackDraft(id, message.trim());
  setWinbackStatus(id, "sent");
  // // TODO: real SMS/DM fan-out via the messaging seam.
  revalidatePath(PATH);
}

/** Defer a customer — keep them in the list but out of the way for now. */
export async function snoozeWinback(id: string): Promise<void> {
  await guard();
  setWinbackStatus(id, "snoozed");
  revalidatePath(PATH);
}

/** Mark that a messaged customer actually came back — the recorded win. */
export async function markWinbackRebooked(id: string): Promise<void> {
  await guard();
  setWinbackStatus(id, "rebooked");
  revalidatePath(PATH);
}

/** Bring a snoozed customer back into the active queue. */
export async function reactivateWinback(id: string): Promise<void> {
  await guard();
  setWinbackStatus(id, "overdue");
  revalidatePath(PATH);
}

/** Ask the agent for an alternate draft. Returns the new text for the UI. */
export async function regenerateWinback(id: string): Promise<string> {
  await guard();
  const next = regenerateWinbackDraft(id);
  revalidatePath(PATH);
  return next ?? "";
}
