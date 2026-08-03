import { toast } from "@/lib/toast";
import type { Plan } from "@/lib/data/types";

const NOT_LIVE =
  "Card checkout is being finalised — email hello.replyora@gmail.com and we'll activate your plan right away.";

/** Start a Stripe Checkout for a plan (redirects). Falls back gracefully while
 * Stripe isn't configured yet. */
export async function startCheckout(plan: Plan): Promise<void> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (res.ok) {
      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
        return;
      }
    }
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    toast({
      title: error === "not_configured" ? NOT_LIVE : "Couldn't start checkout — please try again.",
      type: error === "not_configured" ? "info" : "error",
    });
  } catch {
    toast({ title: "Couldn't start checkout — please try again.", type: "error" });
  }
}

/** Open the Stripe customer portal (redirects). */
export async function openBillingPortal(): Promise<void> {
  try {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.ok) {
      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
        return;
      }
    }
    toast({ title: NOT_LIVE, type: "info" });
  } catch {
    toast({ title: "Couldn't open billing — please try again.", type: "error" });
  }
}
