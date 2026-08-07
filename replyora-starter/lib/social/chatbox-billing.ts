import "server-only";

import { getStripe, HAS_STRIPE } from "@/lib/stripe/server";
import { CHATBOX_ADDON_PRICE_ENV } from "@/lib/social/plans";
import {
  getWorkspaceStripeMeta,
  setWorkspaceChatboxItem,
} from "@/lib/social/billing";
import { countChatboxEnabledClients } from "@/lib/social/client-detail";

/**
 * Per-site chatbox billing.
 *
 * The AI website chatbox is $39/mo AUD per client the agency switches it on for.
 * Rather than one Stripe item per client, we keep a SINGLE subscription-item on
 * the workspace's subscription and set its `quantity` to the number of billable
 * sites (chatbox-enabled clients, minus the one Agency includes free). Toggling
 * any client's chatbox calls this to reconcile the quantity.
 *
 * Completely dormant until Stripe is live: it no-ops unless the secret key, the
 * chatbox price id (STRIPE_PRICE_CHATBOX_ADDON) and a stored subscription id are
 * all present. So the per-client toggle works today; the money follows once the
 * keys are set.
 */
export async function syncChatboxBilling(workspaceId: string): Promise<void> {
  if (!HAS_STRIPE) return;
  const priceId = process.env[CHATBOX_ADDON_PRICE_ENV];
  if (!priceId) return;

  const meta = await getWorkspaceStripeMeta(workspaceId);
  if (!meta.subscriptionId) return; // no live subscription yet — nothing to bill

  // Agency: the chatbox is included for every client → never billed.
  // Personal / Studio: $39/mo per enabled site.
  const quantity =
    meta.accountType === "agency"
      ? 0
      : await countChatboxEnabledClients(workspaceId);

  const stripe = getStripe();

  // Resolve the existing chatbox item (stored id first, else scan the sub).
  let itemId = meta.chatboxItemId;
  if (!itemId) {
    const sub = await stripe.subscriptions.retrieve(meta.subscriptionId);
    itemId = sub.items.data.find((i) => i.price?.id === priceId)?.id ?? null;
  }

  if (quantity === 0) {
    // No billable sites — drop the item entirely (prorate the credit).
    if (itemId) {
      await stripe.subscriptionItems.del(itemId, {
        proration_behavior: "create_prorations",
      });
    }
    await setWorkspaceChatboxItem(workspaceId, null);
    return;
  }

  if (itemId) {
    await stripe.subscriptionItems.update(itemId, { quantity });
  } else {
    const created = await stripe.subscriptionItems.create({
      subscription: meta.subscriptionId,
      price: priceId,
      quantity,
      proration_behavior: "create_prorations",
    });
    itemId = created.id;
  }
  await setWorkspaceChatboxItem(workspaceId, itemId);
}
