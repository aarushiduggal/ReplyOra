import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
import { socialPlanForPriceId } from "@/lib/social/plans";
import { setWorkspacePlan, getWorkspaceStripeMeta } from "@/lib/social/billing";

export const runtime = "nodejs";

/**
 * Stripe → Neon webhook for the SOCIAL plans (separate from the legacy Supabase
 * webhook). On subscription create/update/delete it writes the active plan +
 * status into workspace_billing by the workspace_id we stamped onto the
 * subscription metadata at checkout. Does NOT touch Supabase.
 *
 * Configure a Stripe endpoint → /api/social/webhook, subscribe to
 * customer.subscription.* , and set STRIPE_SOCIAL_WEBHOOK_SECRET (or reuse
 * STRIPE_WEBHOOK_SECRET) to its signing secret.
 */
export async function POST(req: Request) {
  if (!HAS_STRIPE) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const secret =
    process.env.STRIPE_SOCIAL_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "no_secret" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspace_id;
      // Find the PLAN item explicitly. A subscription can also carry a chatbox
      // add-on item, and item order is not guaranteed — trusting data[0] could
      // map to the add-on price and silently downgrade the customer.
      let mapped: ReturnType<typeof socialPlanForPriceId> = null;
      for (const item of sub.items.data) {
        const m = item.price?.id ? socialPlanForPriceId(item.price.id) : null;
        if (m) {
          mapped = m;
          break;
        }
      }
      if (workspaceId) {
        const deleted = event.type === "customer.subscription.deleted";
        const status = deleted ? "canceled" : sub.status;
        // Persist the subscription id so per-site add-ons (chatbox) can attach
        // items to it; clear it when the subscription is deleted.
        const subId = deleted ? null : sub.id;
        // If no known plan price matched (add-on-only update, or a price-id env
        // mismatch), keep the customer's EXISTING tier — never silently
        // downgrade a paying Agency/Studio customer to personal.
        const plan =
          mapped?.plan ??
          (await getWorkspaceStripeMeta(workspaceId)).accountType ??
          "personal";
        await setWorkspacePlan(workspaceId, plan, status, subId);
      }
    }
  } catch {
    // Swallow data errors — return 200 so Stripe doesn't retry into a loop.
  }
  return NextResponse.json({ received: true });
}
