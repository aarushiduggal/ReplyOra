"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import {
  IMPERSONATION_COOKIE,
  requirePlatformAdmin,
  requireSuperadmin,
  type StaffIdentity,
} from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit";
import {
  adminInsertKnowledge,
  adminDeleteKnowledge as storeDeleteKnowledge,
  adminSaveBusinessProfile as storeSaveProfile,
} from "@/lib/admin/store";
import {
  ADMIN_BROADCASTS,
  ADMIN_CALLS,
  ADMIN_CLIENTS,
  ADMIN_STAFF,
  ADMIN_TICKETS,
  type CallStatus,
  type TicketStatus,
} from "@/lib/admin/seed";
import type { Plan, PlanStatus } from "@/lib/data/types";
import type { StaffRole } from "@/lib/admin/access";

function clientName(id: string): string {
  return ADMIN_CLIENTS.find((c) => c.id === id)?.name ?? id;
}

async function audit(
  staff: StaffIdentity,
  action: string,
  workspaceId: string | null,
  target?: string,
) {
  await logAdminAction({
    actorId: staff.userId,
    actorName: staff.name,
    workspaceId,
    workspaceName: workspaceId ? clientName(workspaceId) : null,
    action,
    target: target ?? null,
  });
}

// ---------- Impersonation ----------

export async function startImpersonation(
  workspaceId: string,
  mode: "edit" | "view",
): Promise<void> {
  const staff = await requirePlatformAdmin();
  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE, JSON.stringify({ workspaceId, mode }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  await audit(
    staff,
    mode === "view" ? "client.view_as" : "client.manage",
    workspaceId,
    mode,
  );
  redirect("/dashboard");
}

export async function stopImpersonation(): Promise<void> {
  await requirePlatformAdmin();
  const jar = await cookies();
  jar.delete(IMPERSONATION_COOKIE);
  redirect("/admin/clients");
}

// ---------- Client resources (edit on behalf) ----------

export async function adminAddKnowledge(
  clientId: string,
  input: { type: "text" | "faq" | "pricing" | "service" | "url"; title: string; preview: string },
): Promise<void> {
  const staff = await requirePlatformAdmin();
  await adminInsertKnowledge(clientId, input);
  await audit(staff, "knowledge.create", clientId, input.title);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard/knowledge");
}

export async function adminRemoveKnowledge(
  clientId: string,
  sourceId: string,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  await storeDeleteKnowledge(clientId, sourceId);
  await audit(staff, "knowledge.delete", clientId, sourceId);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard/knowledge");
}

export async function adminSaveProfile(
  clientId: string,
  patch: { industry?: string; description?: string; phone?: string; email?: string; website?: string; address?: string },
): Promise<void> {
  const staff = await requirePlatformAdmin();
  await storeSaveProfile(clientId, patch);
  await audit(staff, "business_profile.update", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard/business");
}

export async function adminResolveGap(
  clientId: string,
  question: string,
  answer: string,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  await adminInsertKnowledge(clientId, {
    type: "faq",
    title: question,
    preview: `Q: ${question}\nA: ${answer}`,
  });
  await audit(staff, "knowledge.gap.resolve", clientId, question);
  revalidatePath("/admin/quality");
  revalidatePath(`/admin/clients/${clientId}`);
}

// ---------- Client account actions ----------

export async function adminChangePlan(
  clientId: string,
  plan: Plan,
  status: PlanStatus,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  if (!USE_SUPABASE) {
    const c = ADMIN_CLIENTS.find((x) => x.id === clientId);
    if (c) {
      c.plan = plan;
      c.status = status;
    }
  } else {
    const admin = createAdminClient();
    await admin
      .from("workspaces")
      .update({ plan, plan_status: status })
      .eq("id", clientId);
  }
  await audit(staff, "plan.change", clientId, `${plan}/${status}`);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function adminSetPaused(
  clientId: string,
  paused: boolean,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  const c = ADMIN_CLIENTS.find((x) => x.id === clientId);
  if (c) c.paused = paused;
  await audit(staff, paused ? "client.pause" : "client.resume", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function adminSaveNotes(
  clientId: string,
  notes: string,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  const c = ADMIN_CLIENTS.find((x) => x.id === clientId);
  if (c) c.notes = notes;
  await audit(staff, "notes.update", clientId);
  revalidatePath(`/admin/clients/${clientId}`);
}

// ---------- Service delivery ----------

export async function adminUpdateTicket(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  const t = ADMIN_TICKETS.find((x) => x.id === ticketId);
  if (t) t.status = status;
  await audit(staff, "service.ticket.update", t?.clientId ?? null, `${ticketId}:${status}`);
  revalidatePath("/admin/service");
}

export async function adminLogCall(
  callId: string,
  status: CallStatus,
  notes: string,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  const call = ADMIN_CALLS.find((x) => x.id === callId);
  if (call) {
    call.status = status;
    if (notes) call.notes = notes;
  }
  await audit(staff, "service.call.log", call?.clientId ?? null, status);
  revalidatePath("/admin/service");
}

// ---------- Staff management (superadmin) ----------

export async function adminAddStaff(
  email: string,
  role: StaffRole,
): Promise<void> {
  const staff = await requireSuperadmin();
  if (!USE_SUPABASE) {
    ADMIN_STAFF.push({
      userId: `staff_${Math.random().toString(36).slice(2, 8)}`,
      name: email.split("@")[0] ?? email,
      email,
      role,
      createdAt: new Date().toISOString(),
    });
  }
  // Live: adding staff requires the user's auth UUID (they must have signed in).
  // Done via SQL/service role against platform_admins. // TODO: email→uuid lookup.
  await audit(staff, "staff.add", null, `${email}:${role}`);
  revalidatePath("/admin/staff");
}

export async function adminRemoveStaff(userId: string): Promise<void> {
  const staff = await requireSuperadmin();
  if (!USE_SUPABASE) {
    const i = ADMIN_STAFF.findIndex((s) => s.userId === userId);
    if (i >= 0) ADMIN_STAFF.splice(i, 1);
  } else {
    const admin = createAdminClient();
    await admin.from("platform_admins").delete().eq("user_id", userId);
  }
  await audit(staff, "staff.remove", null, userId);
  revalidatePath("/admin/staff");
}

// ---------- Broadcast ----------

export async function adminSendBroadcast(
  subject: string,
  body: string,
): Promise<void> {
  const staff = await requirePlatformAdmin();
  ADMIN_BROADCASTS.unshift({
    id: `bc_${Math.random().toString(36).slice(2, 8)}`,
    subject,
    body,
    audience: "All clients",
    sentAt: new Date().toISOString(),
  });
  // // TODO: real email fan-out to all client owners.
  await audit(staff, "broadcast.send", null, subject);
  revalidatePath("/admin/broadcast");
}
