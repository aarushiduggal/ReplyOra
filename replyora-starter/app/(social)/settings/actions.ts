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
