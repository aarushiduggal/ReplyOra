import { notFound } from "next/navigation";

import { getAssistantByPublicKey } from "@/lib/data/assistant";
import { getAvailableSlots } from "@/lib/data/bookings";
import { USE_SUPABASE } from "@/lib/data/mode";
import { DEMO_WORKSPACE } from "@/lib/data/seed";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/usage";
import { Chat } from "@/components/widget/chat";
import type { Assistant, Plan } from "@/lib/data/types";

/** Resolve the owning workspace's name + plan for feature gating (service role). */
async function resolveWorkspace(
  assistant: Assistant,
): Promise<{ name: string; plan: Plan }> {
  if (!USE_SUPABASE) {
    return { name: DEMO_WORKSPACE.name, plan: DEMO_WORKSPACE.plan };
  }
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("workspaces")
      .select("name, plan")
      .eq("id", assistant.workspaceId)
      .maybeSingle();
    return {
      name: (data?.name as string) ?? "our business",
      plan: (data?.plan as Plan) ?? "none",
    };
  } catch {
    return { name: "our business", plan: "none" };
  }
}

/**
 * Hosted widget page — the iframe target that embed.js loads.
 * Renders the shared Chat UI full-height. Booking and branding removal are
 * gated by the owning workspace's plan.
 */
export default async function WidgetPage({
  params,
}: {
  params: Promise<{ publicKey: string }>;
}) {
  const { publicKey } = await params;
  const assistant = await getAssistantByPublicKey(publicKey);
  if (!assistant) notFound();

  const { name, plan } = await resolveWorkspace(assistant);
  const bookingSlots = hasFeature(plan, "booking")
    ? await getAvailableSlots()
    : undefined;
  const showBranding = !(
    hasFeature(plan, "removeBranding") && assistant.removeBranding
  );

  return (
    <div className="h-screen w-screen bg-cream">
      <Chat
        config={{
          publicKey: assistant.publicKey,
          name: assistant.name,
          welcomeMessage: assistant.welcomeMessage,
          suggestedQuestions: assistant.suggestedQuestions,
          brandColor: assistant.brandColor,
          leadFields: assistant.leadFields,
          businessName: name,
          showBranding,
          bookingSlots,
        }}
      />
    </div>
  );
}
