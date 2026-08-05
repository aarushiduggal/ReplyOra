"use server";

import { revalidatePath } from "next/cache";

import {
  addMember,
  setMemberRole,
  assignToClient,
  unassignFromClient,
  type AgencyRole,
  type ClientRole,
} from "@/lib/social/team";
import {
  createRetainer,
  setRetainerStatus,
  runRetainer,
  runDueRetainers,
  type RetainerInterval,
  type RetainerStatus,
} from "@/lib/social/retainers";

/**
 * Server actions for the Agency Command Center.
 *
 * NOTE: the /agency route already sits inside the auth-gated (social) group.
 * For per-capability enforcement, resolve the current member's role and gate
 * with `can(role, "manage_team" | "manage_billing" | "manage_clients")` from
 * `@/lib/social/team` — left as a one-line guard where marked.
 */

const AGENCY_PATH = "/agency";

/* ── team ─────────────────────────────────────────────────────────── */

export async function addMemberAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = (String(formData.get("role") ?? "editor") as AgencyRole);
  const weeklyCapacity = Number(formData.get("weeklyCapacity") ?? 25);
  if (!name || !email) return { ok: false, error: "Name and email are required." };
  // guard: can(currentRole, "manage_team")
  await addMember({ name, email, role, weeklyCapacity });
  revalidatePath(AGENCY_PATH);
  return { ok: true };
}

export async function setRoleAction(memberId: string, role: AgencyRole) {
  // guard: can(currentRole, "manage_team")
  await setMemberRole(memberId, role);
  revalidatePath(AGENCY_PATH);
}

export async function assignAction(clientId: string, memberId: string, roleOnClient: ClientRole) {
  // guard: can(currentRole, "manage_clients")
  await assignToClient(clientId, memberId, roleOnClient);
  revalidatePath(AGENCY_PATH);
  revalidatePath(`/clients/${clientId}`);
}

export async function unassignAction(clientId: string, memberId: string) {
  await unassignFromClient(clientId, memberId);
  revalidatePath(AGENCY_PATH);
}

/* ── retainers / billing ──────────────────────────────────────────── */

export async function createRetainerAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const clientName = String(formData.get("clientName") ?? "Client");
  const clientEmail = String(formData.get("clientEmail") ?? "") || undefined;
  const name = String(formData.get("name") ?? "Monthly retainer").trim();
  const amount = Math.round(Number(formData.get("amount") ?? 0) * 100);
  const interval = (String(formData.get("interval") ?? "month") as RetainerInterval);
  const anchorDay = Number(formData.get("anchorDay") ?? 1);
  if (!clientId || amount <= 0) return { ok: false, error: "Pick a client and an amount." };
  // guard: can(currentRole, "manage_billing")
  await createRetainer({ clientId, clientName, clientEmail, name, amountCents: amount, interval, anchorDay });
  revalidatePath(AGENCY_PATH);
  return { ok: true };
}

export async function setRetainerStatusAction(id: string, status: RetainerStatus) {
  await setRetainerStatus(id, status);
  revalidatePath(AGENCY_PATH);
}

export async function runRetainerAction(id: string, clientName?: string) {
  const res = await runRetainer(id, clientName);
  revalidatePath(AGENCY_PATH);
  return res;
}

export async function runDueRetainersAction() {
  const n = await runDueRetainers();
  revalidatePath(AGENCY_PATH);
  return { count: n };
}
