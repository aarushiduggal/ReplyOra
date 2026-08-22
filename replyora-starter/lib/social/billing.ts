import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

import { getCurrentWorkspaceId, getCurrentUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { betaWindowFor, type BetaWindow } from "@/lib/beta";
import {
  EMPTY_ADDONS,
  EMPTY_ADDRESS,
  SOCIAL_PRICE_ENV,
  effectiveAccountType,
  entitlementsFor,
  type Address,
  type BillingInterval,
  type Entitlements,
  type SocialAddons,
  type SocialPlan,
  type WorkspaceBilling,
} from "@/lib/social/plans";

/**
 * ReplyOra Social — agency workspace billing & branding (workspace_billing).
 * Feeds invoice defaults (tax/terms/currency), the report title, and the
 * business identity shown on client portals, invoices and reports.
 *
 * Client-safe constants & types live in ./plans (re-exported here for server
 * callers). This module adds the Neon-backed read/write functions.
 */

export * from "@/lib/social/plans";

const DEFAULTS: WorkspaceBilling = {
  businessName: "",
  logoUrl: "",
  address: EMPTY_ADDRESS,
  reportTitle: "Performance Analytics",
  taxRate: 0,
  terms: "Payment due within 14 days.",
  currency: "AUD",
  businessEmail: "",
  businessPhone: "",
  plan: "personal",
  planStatus: "trialing",
  accountType: null,
  hasStripeSubscription: false,
  addons: EMPTY_ADDONS,
};

export function socialPriceId(plan: SocialPlan, interval: BillingInterval): string | null {
  const envName = SOCIAL_PRICE_ENV[plan][interval];
  return process.env[envName] ?? null;
}

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

const MEM = new Map<string, WorkspaceBilling>();

// Mock mode (no Neon) has no durable store, and module memory doesn't survive
// between dev requests — so add-ons are persisted in a cookie there instead,
// which makes the Settings toggles actually stick and re-gate the nav.
const ADDONS_COOKIE = "ro_addons";

async function readMockAddons(): Promise<SocialAddons | null> {
  try {
    const raw = (await cookies()).get(ADDONS_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SocialAddons>;
    return { ...EMPTY_ADDONS, ...parsed };
  } catch {
    return null;
  }
}

// Contact (email/phone) is packed into the address JSONB so no schema change
// is needed beyond migration 0003's workspace_billing table.
interface AddressJson extends Partial<Address> {
  email?: string;
  phone?: string;
  plan?: SocialPlan;
  planStatus?: string;
  accountType?: SocialPlan | null;
  addons?: SocialAddons;
  /** Stripe subscription for this workspace (needed to attach add-on items). */
  stripeSubscriptionId?: string | null;
  /** Stripe subscription-item id for the per-site chatbox add-on (qty = sites). */
  chatboxItemId?: string | null;
}
interface Row {
  business_name: string | null;
  logo_url: string | null;
  address: AddressJson | null;
  report_title: string | null;
  tax_rate: string | number | null;
  terms: string | null;
  currency: string | null;
}

export async function getWorkspaceBilling(): Promise<WorkspaceBilling> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    // Local/demo mode: default to a fully-unlocked Agency workspace so every
    // section (incl. Chatbox + Reports) is visible. Cookie/MEM still override.
    const base = MEM.get(workspaceId) ?? {
      ...DEFAULTS,
      accountType: "agency" as SocialPlan,
      addons: { chatbox: true, reports: true },
    };
    const cookieAddons = await readMockAddons();
    return cookieAddons ? { ...base, addons: cookieAddons } : base;
  }
  // Read is resilient: getWorkspaceBilling is called uncaught in the (social)
  // layout AND the Settings page, so a transient Neon error during an RSC
  // soft-navigation would throw the whole render (the "error page on nav, fine
  // on reload" bug). Retry once; only a persistent failure falls to DEFAULTS.
  let rows: Row[];
  try {
    rows = (await sql()`
      SELECT business_name, logo_url, address, report_title, tax_rate, terms, currency
      FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
    `) as Row[];
  } catch {
    try {
      rows = (await sql()`
        SELECT business_name, logo_url, address, report_title, tax_rate, terms, currency
        FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
      `) as Row[];
    } catch {
      return { ...DEFAULTS };
    }
  }
  const r = rows[0];
  if (!r) return { ...DEFAULTS };
  const addr = r.address ?? {};
  return {
    businessName: r.business_name ?? "",
    logoUrl: r.logo_url ?? "",
    address: {
      street: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.zip ?? "",
      country: addr.country ?? "Australia",
    },
    reportTitle: r.report_title ?? "Performance Analytics",
    taxRate: Number(r.tax_rate ?? 0),
    terms: r.terms ?? "",
    currency: r.currency ?? "AUD",
    businessEmail: addr.email ?? "",
    businessPhone: addr.phone ?? "",
    plan: addr.plan ?? "personal",
    planStatus: addr.planStatus ?? "trialing",
    accountType: addr.accountType ?? null,
    hasStripeSubscription: Boolean(addr.stripeSubscriptionId),
    addons: { ...EMPTY_ADDONS, ...(addr.addons ?? {}) },
  };
}

/**
 * Entitlements for the CURRENT user — the single source of truth for gating.
 * The owner always gets full access; otherwise a live Stripe subscription's plan
 * wins over a stale onboarding accountType. Returns billing too so callers that
 * already need it don't double-fetch.
 */
export async function currentEntitlements(): Promise<{
  billing: WorkspaceBilling;
  type: SocialPlan;
  ent: Entitlements;
  beta: BetaWindow;
}> {
  const billing = await getWorkspaceBilling();
  let type: SocialPlan | null = effectiveAccountType(billing);
  let beta: BetaWindow = {
    isBeta: false,
    active: false,
    expiresAt: null,
    daysLeft: 0,
  };
  try {
    const user = await getCurrentUser();
    if (isOwner(user.email)) type = "agency";
    beta = await betaWindowFor(user.email);
    // Beta testers get the WHOLE product for their 30 days, whatever they
    // picked at onboarding. We asked them to judge Replyora; judging a
    // cut-down version of it would tell us nothing. A real paid subscription
    // still wins, so someone who converts mid-beta keeps what they bought.
    if (beta.active && !billing.hasStripeSubscription) type = "agency";
  } catch {
    /* not signed in — keep resolved type */
  }
  const resolved: SocialPlan = type ?? "agency";
  return {
    billing,
    type: resolved,
    ent: entitlementsFor(resolved, billing.addons),
    beta,
  };
}

export async function saveWorkspaceBilling(
  patch: Partial<WorkspaceBilling>,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  const current = await getWorkspaceBilling();
  const next = { ...current, ...patch };
  if (!hasDb()) {
    MEM.set(workspaceId, next);
    return;
  }
  const addressJson: AddressJson = {
    ...next.address,
    email: next.businessEmail,
    phone: next.businessPhone,
    plan: next.plan,
    planStatus: next.planStatus,
    accountType: next.accountType,
    addons: next.addons,
  };
  await sql()`
    INSERT INTO workspace_billing
      (workspace_id, business_name, logo_url, address, report_title, tax_rate, terms, currency)
    VALUES
      (${workspaceId}, ${next.businessName}, ${next.logoUrl},
       ${JSON.stringify(addressJson)}, ${next.reportTitle}, ${next.taxRate},
       ${next.terms}, ${next.currency})
    ON CONFLICT (workspace_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      logo_url = EXCLUDED.logo_url,
      address = EXCLUDED.address,
      report_title = EXCLUDED.report_title,
      tax_rate = EXCLUDED.tax_rate,
      terms = EXCLUDED.terms,
      currency = EXCLUDED.currency
  `;
}

/** Set the current workspace's account type (onboarding + owner switch). */
export async function setAccountType(type: SocialPlan | null): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const cur = MEM.get(workspaceId) ?? { ...DEFAULTS };
    MEM.set(workspaceId, { ...cur, accountType: type });
    return;
  }
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), accountType: type };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}

/** Staff: set add-ons for a SPECIFIC workspace (admin agency console). */
export async function setWorkspaceAddonsById(
  workspaceId: string,
  addons: SocialAddons,
): Promise<void> {
  if (!hasDb()) return; // mock: optimistic only (seeded agencies are constant)
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), addons };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}

/** Staff: set plan/status for a SPECIFIC workspace (admin agency console). */
export async function setWorkspacePlanById(
  workspaceId: string,
  accountType: SocialPlan,
  planStatus: string,
): Promise<void> {
  if (!hasDb()) return;
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = {
    ...(rows[0]?.address ?? {}),
    accountType,
    planStatus,
  };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}

/** Update the workspace's paid add-ons (build-your-plan toggles in Settings). */
export async function setAddons(addons: SocialAddons): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const cur = MEM.get(workspaceId) ?? { ...DEFAULTS };
    MEM.set(workspaceId, { ...cur, addons });
    // Durable across dev requests (module memory isn't).
    (await cookies()).set(ADDONS_COOKIE, JSON.stringify(addons), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return;
  }
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), addons };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}

/**
 * Owner "reset my account": wipe THIS workspace's demo data and clear the
 * account type so onboarding runs again. Deleting clients cascades their posts,
 * assets, approvals, invoices, pillars, assistants and knowledge; we also clear
 * workspace-level rows (tasks, any client-less posts/assets/invoices).
 */
export async function resetMyWorkspaceData(): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const cur = MEM.get(workspaceId);
    if (cur) MEM.set(workspaceId, { ...cur, accountType: null });
    return;
  }
  await sql()`DELETE FROM clients WHERE workspace_id = ${workspaceId}`;
  await sql()`DELETE FROM social_posts WHERE workspace_id = ${workspaceId}`;
  await sql()`DELETE FROM assets WHERE workspace_id = ${workspaceId}`;
  await sql()`DELETE FROM invoices WHERE workspace_id = ${workspaceId}`;
  await sql()`DELETE FROM tasks WHERE workspace_id = ${workspaceId}`;
  // Clear the chosen account type (packed in the address JSONB) → re-onboard.
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), accountType: null };
  await sql()`
    UPDATE workspace_billing SET address = ${JSON.stringify(addressJson)}
    WHERE workspace_id = ${workspaceId}
  `;
}

/**
 * Session-less plan write for the Stripe webhook (no auth context). Merges the
 * plan + status into the workspace_billing.address JSONB by workspace_id,
 * preserving the business/branding fields.
 */
export async function setWorkspacePlan(
  workspaceId: string,
  plan: SocialPlan,
  planStatus: string,
  stripeSubscriptionId?: string | null,
): Promise<void> {
  if (!hasDb()) {
    const cur = MEM.get(workspaceId) ?? { ...DEFAULTS };
    MEM.set(workspaceId, { ...cur, plan, planStatus, accountType: plan });
    return;
  }
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  // Keep accountType in lock-step with the paid plan so entitlements (Reports,
  // invoicing, etc.) reflect what the customer is actually paying for.
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), plan, planStatus, accountType: plan };
  // Only overwrite the subscription id when the webhook actually gave us one.
  if (stripeSubscriptionId !== undefined) addressJson.stripeSubscriptionId = stripeSubscriptionId;
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}

/** Read the Stripe billing pointers we stashed in the address JSONB. */
export async function getWorkspaceStripeMeta(
  workspaceId: string,
): Promise<{ subscriptionId: string | null; chatboxItemId: string | null; accountType: SocialPlan | null }> {
  if (!hasDb()) return { subscriptionId: null, chatboxItemId: null, accountType: null };
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const a = rows[0]?.address ?? {};
  return {
    subscriptionId: a.stripeSubscriptionId ?? null,
    chatboxItemId: a.chatboxItemId ?? null,
    accountType: a.accountType ?? null,
  };
}

/** Persist (or clear) the Stripe subscription-item id for the chatbox add-on. */
export async function setWorkspaceChatboxItem(
  workspaceId: string,
  chatboxItemId: string | null,
): Promise<void> {
  if (!hasDb()) return;
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), chatboxItemId };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}
