"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";
import { USE_AUTHJS, USE_SUPABASE } from "@/lib/data/mode";
import {
  setWorkspaceAddonsById,
  setWorkspacePlanById,
} from "@/lib/social/billing";
import type { SocialAddons, SocialPlan } from "@/lib/social/plans";

async function requireStaff() {
  const user = await getCurrentUser();
  const mock = !USE_AUTHJS && !USE_SUPABASE;
  if (!mock && !isStaff(user.email)) throw new Error("forbidden");
}

/** Staff toggles an agency's add-ons from the console. */
export async function adminSetAgencyAddonsAction(
  workspaceId: string,
  addons: SocialAddons,
): Promise<void> {
  await requireStaff();
  await setWorkspaceAddonsById(workspaceId, addons);
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin");
}

/** Staff changes an agency's plan / billing status from the console. */
export async function adminSetAgencyPlanAction(
  workspaceId: string,
  accountType: SocialPlan,
  planStatus: string,
): Promise<void> {
  await requireStaff();
  await setWorkspacePlanById(workspaceId, accountType, planStatus);
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin");
}
