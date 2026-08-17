import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DEMO_USER, DEMO_WORKSPACE } from "@/lib/data/seed";
import { USE_SUPABASE, USE_AUTHJS } from "@/lib/data/mode";
import type { User } from "@/lib/data/types";

/**
 * The signed-in user.
 * Auth.js (Netlify/Neon): reads the Auth.js session; redirects to /login if none.
 * Supabase (Vercel): reads the Supabase session.
 * MOCK (local dev, neither configured): the demo owner.
 */
export async function getCurrentUser(): Promise<User> {
  if (USE_AUTHJS) {
    const { auth } = await import("@/auth");
    // A corrupt or incompatible session cookie (e.g. left over from a failed
    // OAuth attempt, or an older token) must NOT 500 the whole dashboard —
    // .catch swallows the decode error and we treat it as signed-out.
    const session = await auth().catch(() => null);
    if (!session?.user?.id) redirect("/login");
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      fullName:
        session.user.name || session.user.email?.split("@")[0] || "there",
      avatarUrl: session.user.image ?? null,
    };
  }
  if (!USE_SUPABASE) return DEMO_USER;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "there";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    avatarUrl: (meta.avatar_url as string) ?? null,
  };
}

/**
 * The current workspace id — resolved from the real session's membership.
 * NEVER trusts a client-supplied workspace_id.
 * MOCK: the demo workspace.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  if (USE_AUTHJS) {
    const { auth } = await import("@/auth");
    // bad/incompatible session → sign in again, never 500
    const session = await auth().catch(() => null);
    if (!session?.user?.id) redirect("/login");

    // Staff/owner "Enter as": a valid, signed impersonation cookie whose actor
    // matches the signed-in staff user resolves to the impersonated workspace.
    // This is the ONLY impersonation path — the legacy unsigned admin_ctx cookie
    // is no longer honoured (it was forgeable and granted cross-tenant access).
    const { readImpersonation } = await import("@/lib/admin/impersonate");
    const { isStaff } = await import("@/lib/auth/owner");
    const imp = await readImpersonation();
    if (
      imp &&
      imp.actorUserId === session.user.id &&
      isStaff(session.user.email)
    ) {
      return imp.workspaceId;
    }

    if (session.user.workspaceId) return session.user.workspaceId;
    // First request right after sign-up (or a transient Neon error in the jwt
    // callback) can leave the token without a workspace id. Resolve/create it
    // here instead of bouncing to /login — this is what makes sign-up land.
    try {
      const { getOrCreateWorkspace } = await import("@/lib/auth/users");
      return await getOrCreateWorkspace(
        session.user.id,
        session.user.name ?? session.user.email ?? "My",
      );
    } catch {
      redirect("/login"); // couldn't resolve a workspace → sign in again, never 500
    }
  }

  if (!USE_SUPABASE) return DEMO_WORKSPACE.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.workspace_id) redirect("/login");
  return data.workspace_id;
}

export async function isAuthenticated(): Promise<boolean> {
  if (USE_AUTHJS) {
    const { auth } = await import("@/auth");
    const session = await auth();
    return Boolean(session?.user?.id);
  }
  if (!USE_SUPABASE) return true;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}
