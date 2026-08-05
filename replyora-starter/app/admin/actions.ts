"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";
import { USE_AUTHJS, USE_SUPABASE } from "@/lib/data/mode";
import {
  clearImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/admin/impersonate";

/** "Enter as" — staff/owner starts impersonating a workspace. */
export async function enterAsAction(workspaceId: string): Promise<void> {
  const user = await getCurrentUser();
  // Auth.js/prod: email-based staff gate. Local mock: the demo user is staff.
  const mock = !USE_AUTHJS && !USE_SUPABASE;
  if (!mock && !isStaff(user.email)) throw new Error("forbidden");
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
