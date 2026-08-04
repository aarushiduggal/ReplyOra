import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import {
  EMPTY_ADDRESS,
  SOCIAL_PRICE_ENV,
  type Address,
  type BillingInterval,
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

// Contact (email/phone) is packed into the address JSONB so no schema change
// is needed beyond migration 0003's workspace_billing table.
interface AddressJson extends Partial<Address> {
  email?: string;
  phone?: string;
  plan?: SocialPlan;
  planStatus?: string;
  accountType?: SocialPlan | null;
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
  if (!hasDb()) return MEM.get(workspaceId) ?? { ...DEFAULTS };
  const rows = (await sql()`
    SELECT business_name, logo_url, address, report_title, tax_rate, terms, currency
    FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as Row[];
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
): Promise<void> {
  if (!hasDb()) {
    const cur = MEM.get(workspaceId) ?? { ...DEFAULTS };
    MEM.set(workspaceId, { ...cur, plan, planStatus });
    return;
  }
  const rows = (await sql()`
    SELECT address FROM workspace_billing WHERE workspace_id = ${workspaceId} LIMIT 1
  `) as { address: AddressJson | null }[];
  const addressJson: AddressJson = { ...(rows[0]?.address ?? {}), plan, planStatus };
  await sql()`
    INSERT INTO workspace_billing (workspace_id, address)
    VALUES (${workspaceId}, ${JSON.stringify(addressJson)})
    ON CONFLICT (workspace_id) DO UPDATE SET address = ${JSON.stringify(addressJson)}
  `;
}
