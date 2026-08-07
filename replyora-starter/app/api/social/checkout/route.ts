import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
import { APP_URL } from "@/lib/data/mode";
import {
  socialPriceId,
  type BillingInterval,
  type SocialPlan,
} from "@/lib/social/billing";

export const runtime = "nodejs";

/**
 * POST /api/social/checkout — Stripe Checkout for the social plans.
 * Body: { plan: "personal"|"studio"|"agency", interval: "monthly"|"yearly" }
 * Every plan: a 7-day free trial that REQUIRES a card up front and auto-converts.
 * Dormant until STRIPE_SECRET_KEY + the price ids are set.
 */
export async function POST(request: Request) {
  if (!HAS_STRIPE) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let workspaceId: string;
  try {
    workspaceId = await getCurrentWorkspaceId();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: SocialPlan;
    interval?: BillingInterval;
    from?: string;
  } | null;
  const plan = body?.plan;
  const interval = body?.interval ?? "monthly";
  const isOnboarding = body?.from === "onboarding";
  if (plan !== "personal" && plan !== "studio" && plan !== "agency") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const priceId = socialPriceId(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const base = APP_URL.replace(/\/$/, "");
  // Onboarding sends the user to a page that verifies the finished Checkout
  // session before granting dashboard access (so a card is genuinely required).
  const successUrl = isOnboarding
    ? `${base}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`
    : `${base}/settings?billing=success`;
  const cancelUrl = isOnboarding ? `${base}/onboarding` : `${base}/settings?billing=cancelled`;

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // 7-day trial on every plan, but the card is collected up front and the
    // subscription auto-converts (cancels if no card was captured).
    payment_method_collection: "always",
    // Session-level metadata so /onboarding/complete can verify + read the plan.
    metadata: { workspace_id: workspaceId, social_plan: plan, interval },
    subscription_data: {
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: { workspace_id: workspaceId, social_plan: plan, interval },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
