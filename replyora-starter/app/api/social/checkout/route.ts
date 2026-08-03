import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
import { APP_URL } from "@/lib/data/mode";
import {
  socialPriceId,
  type BillingInterval,
  type SocialPlan,
} from "@/lib/social/billing";
import { TRIAL_DAYS } from "@/lib/stripe/plans";

export const runtime = "nodejs";

/**
 * POST /api/social/checkout — Stripe Checkout for the social plans.
 * Body: { plan: "personal"|"agency", interval: "monthly"|"yearly" }
 * 7-day trial. Dormant until STRIPE_SECRET_KEY + the price ids are set.
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
  } | null;
  const plan = body?.plan;
  const interval = body?.interval ?? "monthly";
  if (plan !== "personal" && plan !== "agency") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const priceId = socialPriceId(plan, interval);
  if (!priceId) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const base = APP_URL.replace(/\/$/, "");
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { workspace_id: workspaceId, social_plan: plan, interval },
    },
    success_url: `${base}/settings?billing=success`,
    cancel_url: `${base}/settings?billing=cancelled`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
