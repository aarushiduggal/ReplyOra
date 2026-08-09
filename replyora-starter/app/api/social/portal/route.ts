import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { getWorkspaceStripeMeta } from "@/lib/social/billing";
import { APP_URL } from "@/lib/data/mode";
import { HAS_STRIPE, getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

/**
 * Open the Stripe customer portal for the SOCIAL product on Neon so an owner can
 * update their card, view invoices, or cancel — self-serve. We don't store the
 * customer id separately; we resolve it from the subscription we stamped at
 * checkout (getWorkspaceStripeMeta.subscriptionId).
 */
export async function POST() {
  if (!HAS_STRIPE) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const workspaceId = await getCurrentWorkspaceId();
  try {
    const { subscriptionId } = await getWorkspaceStripeMeta(workspaceId);
    if (!subscriptionId) {
      return NextResponse.json({ error: "no_subscription" }, { status: 400 });
    }
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (!customerId) {
      return NextResponse.json({ error: "no_customer" }, { status: 400 });
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/settings?tab=billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "stripe_error" }, { status: 500 });
  }
}
