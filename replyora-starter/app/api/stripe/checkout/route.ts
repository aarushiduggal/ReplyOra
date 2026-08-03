import { NextResponse } from "next/server";

import { getCurrentUser, getCurrentWorkspaceId } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL, USE_SUPABASE } from "@/lib/data/mode";
import {
  HAS_STRIPE,
  getStripe,
  priceIdForPlan,
  setupPriceId,
} from "@/lib/stripe/server";
import { TRIAL_DAYS } from "@/lib/stripe/plans";
import type { Plan } from "@/lib/data/types";

export const runtime = "nodejs";

/**
 * Create a Stripe Checkout session for a subscription (+ one-time setup fee,
 * 7-day trial). Dormant until STRIPE_SECRET_KEY + price ids are set.
 */
export async function POST(request: Request) {
  if (!HAS_STRIPE || !USE_SUPABASE) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { plan?: string };
  try {
    body = (await request.json()) as { plan?: string };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const plan = body.plan as Plan;
  if (!["starter", "growth", "pro"].includes(plan)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  const price = priceIdForPlan(plan);
  if (!price) {
    return NextResponse.json({ error: "missing_price" }, { status: 503 });
  }

  const [user, workspaceId] = await Promise.all([
    getCurrentUser(),
    getCurrentWorkspaceId(),
  ]);

  try {
    const stripe = getStripe();
    const admin = createAdminClient();

    // Reuse or create the Stripe customer for this workspace.
    const { data: ws } = await admin
      .from("workspaces")
      .select("stripe_customer_id, name")
      .eq("id", workspaceId)
      .maybeSingle();

    let customerId = ws?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: (ws?.name as string) ?? user.fullName,
        metadata: { workspace_id: workspaceId },
      });
      customerId = customer.id;
      await admin
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", workspaceId);
    }

    const lineItems: { price: string; quantity: number }[] = [
      { price, quantity: 1 },
    ];
    const setup = setupPriceId();
    if (setup) lineItems.push({ price: setup, quantity: 1 });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: workspaceId,
      line_items: lineItems,
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { workspace_id: workspaceId, plan },
      },
      metadata: { workspace_id: workspaceId, plan },
      allow_promotion_codes: true,
      success_url: `${APP_URL}/dashboard/settings?checkout=success`,
      cancel_url: `${APP_URL}/dashboard/settings?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "stripe_error" }, { status: 500 });
  }
}
