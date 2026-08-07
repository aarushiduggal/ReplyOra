"use server";

import { redirect } from "next/navigation";

import { setAccountType, setAddons } from "@/lib/social/billing";
import type { SocialPlan } from "@/lib/social/plans";

/**
 * New-user onboarding — pick a plan to trial (Personal / Studio / Agency) plus
 * any add-ons ("the things"), then into the dashboard. Agency includes the
 * chatbox, so we only persist the add-on for Personal/Studio.
 */
export async function chooseAccountTypeAction(
  type: SocialPlan,
  chatbox = false,
): Promise<void> {
  await setAccountType(type);
  await setAddons({ chatbox: type !== "agency" && chatbox, reports: false });
  redirect("/clients");
}
