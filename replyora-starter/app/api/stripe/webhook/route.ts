import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { HAS_STRIPE, getStripe, planForPriceId } from "@/lib/stripe/server";
import type { Plan, PlanStatus } from "@/lib/data/types";

export const runtime = "nodejs";

/** Map a Stripe subscription status onto our plan_status. */
function mapStatus(s: Stripe.Subscription.Status): PlanStatus {
  if (s === "trialing") return "trialing";
  if (s === "active") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

/**
 * Stripe webhook — syncs workspaces.plan / plan_status from subscription events.
 * Verifies the signature, is idempotent via stripe_events, and uses the service
 * role (no session). Set STRIPE_WEBHOOK_SECRET + point Stripe at /api/stripe/webhook.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!HAS_STRIPE || !secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip if we've already processed this event.
  const { error: dupErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (dupErr) return NextResponse.json({ received: true, duplicate: true });

  async function applySubscription(sub: Stripe.Subscription) {
    // workspace_id is stamped on subscription_data.metadata at checkout.
    const workspaceId = sub.metadata?.workspace_id;
    if (!workspaceId) return;
    const priceId = sub.items.data[0]?.price.id ?? "";
    const plan: Plan = planForPriceId(priceId) ?? "none";
    await admin
      .from("workspaces")
      .update({
        plan,
        plan_status: mapStatus(sub.status),
        stripe_subscription_id: sub.id,
      })
      .eq("id", workspaceId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof s.subscription === "string" ? s.subscription : s.subscription.id,
          );
          if (!sub.metadata?.workspace_id && s.metadata?.workspace_id) {
            sub.metadata = { ...sub.metadata, workspace_id: s.metadata.workspace_id };
          }
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
