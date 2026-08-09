"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/owner";
import { USE_AUTHJS, USE_SUPABASE } from "@/lib/data/mode";
import {
  getWorkspaceStripeMeta,
  setWorkspaceAddonsById,
  setWorkspacePlanById,
} from "@/lib/social/billing";
import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
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

/**
 * Staff cancels a client's Stripe subscription immediately — voids any upcoming
 * charge (e.g. a trial about to convert). Cancels the real Stripe subscription
 * so the customer is never billed, then reflects "canceled" in our records.
 */
export async function adminCancelSubscriptionAction(
  workspaceId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();
  const { subscriptionId, accountType } = await getWorkspaceStripeMeta(workspaceId);

  if (HAS_STRIPE && subscriptionId) {
    try {
      await getStripe().subscriptions.cancel(subscriptionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "cancel_failed";
      // Already-gone subscriptions are fine — still flip our status below.
      if (!/no such subscription|already canceled|resource_missing/i.test(msg)) {
        return { ok: false, error: msg };
      }
    }
  }

  // Reflect the cancellation locally so the portal + plan gates update. Keep the
  // existing tier; only the status changes to canceled.
  await setWorkspacePlanById(workspaceId, accountType ?? "personal", "canceled");
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin");
  return { ok: true };
}
