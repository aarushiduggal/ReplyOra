"use server";

import { redirect } from "next/navigation";

import { setAccountType, setAddons } from "@/lib/social/billing";
import { HAS_STRIPE } from "@/lib/stripe/server";
import type { SocialPlan } from "@/lib/social/plans";

/**
 * New-user onboarding — the no-card provisioning path, used ONLY when Stripe
 * isn't configured. When Stripe is live, a plan can only be started through
 * Checkout (card required) → /onboarding/complete, so this server action refuses
 * to grant access (even if called directly), keeping the paywall airtight.
 */
export async function chooseAccountTypeAction(
  type: SocialPlan,
  chatbox = false,
): Promise<void> {
  if (HAS_STRIPE) redirect("/onboarding"); // must go through Stripe Checkout
  await setAccountType(type);
  await setAddons({ chatbox: type !== "agency" && chatbox, reports: false });
  redirect("/clients");
}
