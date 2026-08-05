/**
 * ReplyOra Social — client-safe billing constants & types.
 *
 * Kept free of any server-only imports so both client components and server
 * modules can import from here. lib/social/billing.ts re-exports all of this
 * and adds the Neon-backed (server) read/write functions.
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface WorkspaceBilling {
  businessName: string;
  logoUrl: string;
  address: Address;
  reportTitle: string;
  taxRate: number;
  terms: string;
  currency: string;
  businessEmail: string;
  businessPhone: string;
  /** Active social plan + Stripe status (synced by the webhook). */
  plan: SocialPlan;
  planStatus: string;
  /** Chosen at onboarding. null = not onboarded yet → send to /onboarding. */
  accountType: SocialPlan | null;
  /** Paid add-ons the workspace has enabled (build-your-plan). */
  addons: SocialAddons;
}

/** Optional paid features layered on top of the base plan. */
export interface SocialAddons {
  /** Website chatbox (lead capture widget) per client. */
  chatbox: boolean;
  /** Client-facing performance reports. */
  reports: boolean;
}

export const EMPTY_ADDONS: SocialAddons = {
  chatbox: false,
  reports: false,
};

/** What a workspace is actually allowed to do, resolved from plan + add-ons. */
export interface Entitlements {
  /** Max clients this workspace can create (Personal = 1, Agency = up to 10). */
  maxClients: number;
  /** Website chatbox available (add-on). */
  chatbox: boolean;
  /** Performance reports available (add-on). */
  reports: boolean;
}

/** Base client limits per account type. Agency is the multi-client tier. */
export const CLIENT_LIMIT: Record<SocialPlan, number> = {
  personal: 1,
  agency: 10,
};

/**
 * Resolve entitlements from the chosen account type + enabled add-ons.
 * Client-safe (pure) so both the nav and server guards use the same rules.
 */
export function entitlementsFor(
  accountType: SocialPlan | null,
  addons: SocialAddons | undefined,
): Entitlements {
  const type: SocialPlan = accountType ?? "personal";
  const a = addons ?? EMPTY_ADDONS;
  return {
    maxClients: CLIENT_LIMIT[type],
    chatbox: a.chatbox,
    reports: a.reports,
  };
}

export const EMPTY_ADDRESS: Address = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "Australia",
};

/** Social plans — the four Stripe prices the agency can switch between. */
export type SocialPlan = "personal" | "agency";
export type BillingInterval = "monthly" | "yearly";

export const SOCIAL_PRICE_ENV: Record<SocialPlan, Record<BillingInterval, string>> = {
  personal: {
    monthly: "STRIPE_PRICE_PERSONAL_MONTHLY",
    yearly: "STRIPE_PRICE_PERSONAL_YEARLY",
  },
  agency: {
    monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
    yearly: "STRIPE_PRICE_AGENCY_YEARLY",
  },
};

export const SOCIAL_PLAN_PRICE: Record<SocialPlan, Record<BillingInterval, number>> = {
  personal: { monthly: 50, yearly: 500 },
  agency: { monthly: 200, yearly: 2000 },
};

/** Reverse-map a Stripe price id back to a social plan (used by the webhook). */
export function socialPlanForPriceId(
  priceId: string,
): { plan: SocialPlan; interval: BillingInterval } | null {
  for (const plan of ["personal", "agency"] as SocialPlan[]) {
    for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
      if (process.env[SOCIAL_PRICE_ENV[plan][interval]] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}
