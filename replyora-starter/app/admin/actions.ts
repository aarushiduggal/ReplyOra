"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";
import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/admin/impersonate";

/** "Enter as" — staff/owner starts impersonating a workspace. */
export async function enterAsAction(workspaceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!isStaff(user.email)) throw new Error("forbidden");
  await setImpersonationCookie({
    actorUserId: user.id,
    actorEmail: user.email,
    workspaceId,
  });
  redirect("/clients");
}

/** Exit impersonation and return to the staff portal. */
export async function exitImpersonationAction(): Promise<void> {
  await clearImpersonationCookie();
  redirect("/admin");
}
