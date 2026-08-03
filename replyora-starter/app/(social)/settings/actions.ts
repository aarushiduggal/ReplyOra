"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { updateUserName } from "@/lib/auth/users";
import { saveWorkspaceBilling, type WorkspaceBilling } from "@/lib/social/billing";

export async function saveWorkspaceBillingAction(
  patch: Partial<WorkspaceBilling>,
): Promise<void> {
  await saveWorkspaceBilling(patch);
  revalidatePath("/settings");
}

export async function saveProfileNameAction(fullName: string): Promise<void> {
  const user = await getCurrentUser();
  await updateUserName(user.id, fullName.trim());
  revalidatePath("/settings");
}
