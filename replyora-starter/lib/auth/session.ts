import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DEMO_USER, DEMO_WORKSPACE } from "@/lib/data/seed";
import { USE_SUPABASE } from "@/lib/data/mode";
import { getImpersonation } from "@/lib/admin/access";
import type { User } from "@/lib/data/types";

/**
 * The signed-in user.
 * LIVE: reads the Supabase session; redirects to /login if none.
 * MOCK (local dev): the demo owner.
 */
export async function getCurrentUser(): Promise<User> {
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
  // Staff impersonation: a platform admin acting inside a client's workspace.
  // Only honoured for real staff (checked inside getImpersonation).
  const imp = await getImpersonation();
  if (imp) return imp.workspaceId;

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
  if (!USE_SUPABASE) return true;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}
