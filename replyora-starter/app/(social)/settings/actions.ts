"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { updateUserName } from "@/lib/auth/users";
import {
  saveWorkspaceBilling,
  setAddons,
  type SocialAddons,
  type WorkspaceBilling,
} from "@/lib/social/billing";
import { setNewsletterOptIn, requestDeletion } from "@/lib/social/preferences";

export async function saveWorkspaceBillingAction(
  patch: Partial<WorkspaceBilling>,
): Promise<void> {
  await saveWorkspaceBilling(patch);
  revalidatePath("/settings");
}

/** Toggle paid add-ons (chatbox / reports). Re-gates the dashboard nav + pages. */
export async function saveAddonsAction(addons: SocialAddons): Promise<void> {
  await setAddons(addons);
  // Re-gate every route (the client sub-nav lives in a nested layout).
  revalidatePath("/", "layout");
}

export async function saveProfileNameAction(fullName: string): Promise<void> {
  const user = await getCurrentUser();
  await updateUserName(user.id, fullName.trim());
  revalidatePath("/settings");
}

export async function saveNewsletterOptInAction(optIn: boolean): Promise<void> {
  await setNewsletterOptIn(optIn);
  revalidatePath("/settings");
}

export async function requestDeletionAction(reason: string): Promise<void> {
  await requestDeletion(reason.trim());
  revalidatePath("/settings");
}
