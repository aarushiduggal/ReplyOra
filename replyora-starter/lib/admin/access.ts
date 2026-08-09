import "server-only";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";

/**
 * Platform-staff access control for the /admin portal.
 *
 * SECURITY (see ADMIN_PORTAL.md + 0002_platform_admin.sql):
 *  - Only users in `platform_admins` may reach /admin. Enforced in middleware
 *    AND here (layout + every /api/admin handler calls requirePlatformAdmin()).
 *  - Cross-client data uses the SERVICE ROLE, server-side only. Per-tenant RLS
 *    from 0001 is never weakened.
 *  - Non-staff get notFound() (404) — the portal's existence isn't revealed.
 */

export type StaffRole = "staff" | "superadmin";

export interface StaffIdentity {
  userId: string;
  email: string;
  name: string;
  role: StaffRole;
}

/** Mock staff identity used in local/demo mode (no Supabase). */
const MOCK_STAFF: StaffIdentity = {
  userId: "user_demo_owner",
  email: "aarushi@replyora.com",
  name: "Aarushi",
  role: "superadmin",
};

/**
 * Resolve the current platform-staff identity, or null if the caller is not
 * Replyora staff. In mock mode the demo user is staff (so the portal is
 * browsable locally) unless the `mock_not_admin` cookie is set — which lets us
 * demonstrate the 404-for-normal-clients behaviour without a real login.
 */
export async function getStaffIdentity(): Promise<StaffIdentity | null> {
  if (!USE_SUPABASE) {
    // Local/demo convenience ONLY. Never grant mock staff in production —
    // otherwise every visitor is treated as a superadmin and the (now-removed)
    // admin_ctx impersonation path would grant cross-tenant access.
    if (process.env.NODE_ENV === "production") return null;
    const jar = await cookies();
    if (jar.get("mock_not_admin")?.value === "1") return null;
    return MOCK_STAFF;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Authoritative check via the service role (bypasses RLS, reliable).
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: user.id,
    email: user.email ?? "",
    name:
      (meta.full_name as string) ||
      (meta.name as string) ||
      user.email?.split("@")[0] ||
      "Staff",
    role: (data.role as StaffRole) ?? "staff",
  };
}

export async function isPlatformAdmin(): Promise<boolean> {
  return (await getStaffIdentity()) !== null;
}

/**
 * Gate a server component / API handler. Returns the staff identity, or 404s
 * (via notFound) for everyone who is not Replyora staff.
 */
export async function requirePlatformAdmin(): Promise<StaffIdentity> {
  const staff = await getStaffIdentity();
  if (!staff) notFound();
  return staff;
}

/** Superadmin-only actions (managing staff). */
export async function requireSuperadmin(): Promise<StaffIdentity> {
  const staff = await requirePlatformAdmin();
  if (staff.role !== "superadmin") notFound();
  return staff;
}

// ---------- Impersonation ("View as" / "Manage on behalf") ----------

export const IMPERSONATION_COOKIE = "admin_ctx";

export interface Impersonation {
  workspaceId: string;
  mode: "edit" | "view";
}

/**
 * Read the active staff impersonation, if any. ONLY honoured when the caller is
 * actually platform staff — a stray cookie on a normal client does nothing.
 */
export async function getImpersonation(): Promise<Impersonation | null> {
  const jar = await cookies();
  const raw = jar.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  if (!(await isPlatformAdmin())) return null;
  try {
    const parsed = JSON.parse(raw) as { workspaceId?: string; mode?: string };
    if (!parsed.workspaceId) return null;
    return {
      workspaceId: parsed.workspaceId,
      mode: parsed.mode === "view" ? "view" : "edit",
    };
  } catch {
    return null;
  }
}
