import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_URL, USE_SUPABASE } from "@/lib/data/mode";
import { HAS_STRIPE, getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

/** Open the Stripe customer portal so an owner can manage/cancel billing. */
export async function POST() {
  if (!HAS_STRIPE || !USE_SUPABASE) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const workspaceId = await getCurrentWorkspaceId();
  try {
    const admin = createAdminClient();
    const { data: ws } = await admin
      .from("workspaces")
      .select("stripe_customer_id")
      .eq("id", workspaceId)
      .maybeSingle();
    const customerId = ws?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json({ error: "no_customer" }, { status: 400 });
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/dashboard/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "stripe_error" }, { status: 500 });
  }
}
