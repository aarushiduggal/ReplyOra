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
  /** Max client/brand accounts (Personal = 1, Studio = 3, Agency = 8). */
  maxClients: number;
  /** "team" on Agency (Full/Limited seats), else single-seat. */
  seats: "single" | "team";
  /** Website chatbox available (Agency includes 1; others via add-on). */
  chatbox: boolean;
  /** Chatboxes included free with the plan (Agency = 1). */
  chatboxIncluded: number;
  /** Performance reports + PDF export (Studio & Agency). */
  reports: boolean;
  /** Studio — Dump & Pair drafts from shoots (Studio & Agency). */
  studioDumpPair: boolean;
  /** Shared workspace asset library (Studio & Agency). */
  sharedLibrary: boolean;
  /** Cross-client task tracking (Studio & Agency). */
  crossClientTasks: boolean;
  /** Workspace team seats Full/Limited (Agency). */
  teamSeats: boolean;
  /** Client invoicing + branded PDF exports (Agency). */
  invoicing: boolean;
  /** Revenue hub & per-client billing settings (Agency). */
  revenueHub: boolean;
}

/** Base client/brand-account limits per plan. */
export const CLIENT_LIMIT: Record<SocialPlan, number> = {
  personal: 1,
  studio: 3,
  agency: 8,
};

/**
 * Resolve entitlements from the chosen plan + enabled add-ons.
 * Client-safe (pure) so both the nav and server guards use the same rules.
 */
export function entitlementsFor(
  accountType: SocialPlan | null,
  addons: SocialAddons | undefined,
): Entitlements {
  // No plan set yet (pre-Stripe / owner) → treat as full-access Agency. Once
  // Stripe assigns a real plan, that explicit value takes over.
  const type: SocialPlan = accountType ?? "agency";
  const a = addons ?? EMPTY_ADDONS;
  const studioPlus = type === "studio" || type === "agency";
  const agency = type === "agency";
  return {
    maxClients: CLIENT_LIMIT[type],
    seats: agency ? "team" : "single",
    // Agency includes one chatbox; any plan can add more via the add-on.
    chatbox: agency || a.chatbox,
    chatboxIncluded: agency ? 1 : 0,
    reports: studioPlus,
    studioDumpPair: studioPlus,
    sharedLibrary: studioPlus,
    crossClientTasks: studioPlus,
    teamSeats: agency,
    invoicing: agency,
    revenueHub: agency,
  };
}

export const EMPTY_ADDRESS: Address = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "Australia",
};

/** Social plans — three tiers, monthly or annual (2 months free). Prices in AUD. */
export type SocialPlan = "personal" | "studio" | "agency";
export type BillingInterval = "monthly" | "yearly";

export const SOCIAL_PLANS: SocialPlan[] = ["personal", "studio", "agency"];
export const PLAN_LABEL: Record<SocialPlan, string> = {
  personal: "Personal",
  studio: "Studio",
  agency: "Agency",
};

/** All prices are AUD. */
export const CURRENCY = "AUD";

/** 7-day free trial on every plan (card required, auto-converts). */
export const TRIAL_DAYS = 7;

export const SOCIAL_PRICE_ENV: Record<SocialPlan, Record<BillingInterval, string>> = {
  personal: {
    monthly: "STRIPE_PRICE_PERSONAL_MONTHLY",
    yearly: "STRIPE_PRICE_PERSONAL_YEARLY",
  },
  studio: {
    monthly: "STRIPE_PRICE_STUDIO_MONTHLY",
    yearly: "STRIPE_PRICE_STUDIO_YEARLY",
  },
  agency: {
    monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
    yearly: "STRIPE_PRICE_AGENCY_YEARLY",
  },
};

/** AUD price points. Annual = 2 months free (10× monthly). */
export const SOCIAL_PLAN_PRICE: Record<SocialPlan, Record<BillingInterval, number>> = {
  personal: { monthly: 49, yearly: 490 },
  studio: { monthly: 79, yearly: 790 },
  agency: { monthly: 249, yearly: 2490 },
};

/** AI website chatbox add-on — $39/mo AUD per client site (recurring). */
export const CHATBOX_ADDON_PRICE = 39;
export const CHATBOX_ADDON_PRICE_ENV = "STRIPE_PRICE_CHATBOX_ADDON";

/** Reverse-map a Stripe price id back to a social plan (used by the webhook). */
export function socialPlanForPriceId(
  priceId: string,
): { plan: SocialPlan; interval: BillingInterval } | null {
  for (const plan of SOCIAL_PLANS) {
    for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
      if (process.env[SOCIAL_PRICE_ENV[plan][interval]] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}
