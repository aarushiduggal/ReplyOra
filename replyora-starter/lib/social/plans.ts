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
