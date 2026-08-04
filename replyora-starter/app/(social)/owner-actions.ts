"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { readImpersonation } from "@/lib/admin/impersonate";
import { resetMyWorkspaceData, setAccountType } from "@/lib/social/billing";
import type { SocialPlan } from "@/lib/social/plans";

/**
 * Owner demo panel actions. Every one re-checks isOwner server-side and refuses
 * while impersonating, so they can only ever touch the OWNER'S OWN workspace.
 */
async function requireOwnerNotImpersonating(): Promise<void> {
  const user = await getCurrentUser();
  if (!isOwner(user.email)) throw new Error("forbidden");
  const imp = await readImpersonation();
  if (imp) throw new Error("cannot run owner actions while impersonating");
}

/** Flip the owner's own account type to demo Personal vs Agency. */
export async function switchAccountTypeAction(type: SocialPlan): Promise<void> {
  await requireOwnerNotImpersonating();
  await setAccountType(type);
  revalidatePath("/", "layout");
}

/** Wipe the owner's own demo data and re-run onboarding. */
export async function resetOwnerAccountAction(): Promise<void> {
  await requireOwnerNotImpersonating();
  await resetMyWorkspaceData();
  redirect("/onboarding");
}
