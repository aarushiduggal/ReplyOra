"use server";

import { redirect } from "next/navigation";

import { setAccountType } from "@/lib/social/billing";
import type { SocialPlan } from "@/lib/social/plans";

/** New-user onboarding — pick Personal or Agency, then into the dashboard. */
export async function chooseAccountTypeAction(type: SocialPlan): Promise<void> {
  await setAccountType(type);
  redirect("/clients");
}
