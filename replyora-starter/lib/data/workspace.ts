import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE, USE_AUTHJS } from "@/lib/data/mode";

import { PLANS, type PlanConfig } from "@/lib/stripe/plans";
import { isCompAccount } from "@/lib/comp-accounts";

import { DEMO_MEMBERS, DEMO_USAGE, DEMO_WORKSPACE } from "./seed";
import type {
  Plan,
  PlanStatus,
  UsageCounter,
  Workspace,
  WorkspaceMember,
} from "./types";

/** Current workspace for the signed-in user. */
export async function getWorkspace(): Promise<Workspace> {
  const workspaceId = await getCurrentWorkspaceId();

  // Auth.js (Netlify/Neon): the user's own workspace from Neon. No billing on
  // this deploy, so present it as active (no trial/paywall UI).
  if (USE_AUTHJS) {
    const { getWorkspaceById } = await import("@/lib/auth/users");
    const ws = await getWorkspaceById(workspaceId);
    return {
      id: workspaceId,
      name: ws?.name ?? "My workspace",
      slug: workspaceId,
      ownerId: "",
      plan: "growth",
      planStatus: "active",
      trialEndsAt: null,
      createdAt: ws?.createdAt ?? new Date().toISOString(),
    };
  }

  if (!USE_SUPABASE) return DEMO_WORKSPACE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  // Resolve the signed-in user once (used for name self-heal + comp override).
  let user: Awaited<ReturnType<typeof getCurrentUser>> | null = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  // Self-heal the generic default so multiple new accounts aren't identical.
  let name = (data?.name as string) ?? "My Workspace";
  if (name === "My Workspace" && user) {
    const first = user.fullName?.trim().split(" ")[0];
    const personalized = first ? `${first}'s workspace` : name;
    if (personalized !== name) {
      name = personalized;
      createAdminClient()
        .from("workspaces")
        .update({ name })
        .eq("id", workspaceId)
        .then(() => {});
    }
  }

  let plan = (data?.plan as Plan) ?? "none";
  let planStatus = (data?.plan_status as PlanStatus) ?? "trialing";
  let trialEndsAt = data?.trial_ends_at ?? null;

  // Comp (internal tester) accounts: always full Pro, active, never charged.
  // Only for the comp user's OWN workspace — never when a staff member is
  // impersonating a client (that must show the client's real plan).
  if (user && data?.owner_id === user.id && isCompAccount(user.email)) {
    plan = "pro";
    planStatus = "active";
    trialEndsAt = null;
  }

  return {
    id: workspaceId,
    name,
    slug: data?.slug ?? workspaceId,
    ownerId: data?.owner_id ?? "",
    plan,
    planStatus,
    trialEndsAt,
    createdAt: data?.created_at ?? new Date().toISOString(),
  };
}

/** Roster for settings → members. */
export async function listMembers(): Promise<WorkspaceMember[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return DEMO_MEMBERS;

  try {
    const supabase = await createClient();
    const [{ data: members }, user] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("user_id, role, created_at")
        .eq("workspace_id", workspaceId),
      getCurrentUser(),
    ]);
    const ids = (members ?? []).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids.length ? ids : [""]);
    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? ""]),
    );

    return (members ?? []).map((m) => ({
      userId: m.user_id,
      email: m.user_id === user.id ? user.email : "",
      fullName:
        (m.user_id === user.id ? user.fullName : nameById.get(m.user_id)) ||
        "Member",
      role: (m.role as WorkspaceMember["role"]) ?? "member",
      createdAt: m.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Current billing-period usage. */
export async function getUsage(): Promise<UsageCounter> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return DEMO_USAGE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    workspaceId,
    periodStart:
      data?.period_start ?? new Date().toISOString().slice(0, 10),
    messagesUsed: data?.messages_used ?? 0,
    leadsCount: data?.leads_count ?? 0,
  };
}

/** Plan config (limits + flags) for the active plan. */
export async function getPlanLimits(): Promise<PlanConfig> {
  const ws = await getWorkspace();
  return PLANS[ws.plan];
}

/** Rename the current workspace (business name shown across the app). */
export async function updateWorkspaceName(name: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return;
  const supabase = await createClient();
  await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
}
