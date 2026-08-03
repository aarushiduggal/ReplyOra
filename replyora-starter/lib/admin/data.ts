import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { PLANS } from "@/lib/stripe/plans";
import { DEMO_LEADS } from "@/lib/data/seed";
import type { LeadStatus, Plan, PlanStatus } from "@/lib/data/types";

import {
  ADMIN_BROADCASTS,
  ADMIN_CALLS,
  ADMIN_CLIENTS,
  ADMIN_INVOICES,
  ADMIN_KNOWLEDGE_GAPS,
  ADMIN_ONBOARDING,
  ADMIN_STAFF,
  ADMIN_TICKETS,
  type AdminClient,
} from "@/lib/admin/seed";

const TODAY = new Date("2026-07-01T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

/** Monthly recurring revenue a client contributes (active + past_due count). */
export function mrrForClient(c: AdminClient): number {
  if (c.paused || c.status === "canceled") return 0;
  if (c.status === "trialing") return 0;
  return PLANS[c.plan]?.priceAud ?? 0;
}

export function messagesCap(plan: Plan): number {
  return PLANS[plan]?.messagesPerMonth ?? 0;
}

export function isOverLimit(c: AdminClient): boolean {
  return c.messagesUsed > messagesCap(c.plan);
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / DAY);
}

// ---------- Clients ----------

export async function listClients(): Promise<AdminClient[]> {
  if (!USE_SUPABASE) return [...ADMIN_CLIENTS];

  // Live: real workspaces via the service role (bypasses RLS — staff only).
  try {
    const admin = createAdminClient();
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, name, slug, owner_id, plan, plan_status, trial_ends_at, created_at")
      .order("created_at", { ascending: false });
    const rows = ws ?? [];
    const ownerIds = rows.map((r) => r.owner_id).filter(Boolean);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds.length ? ownerIds : [""]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return rows.map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "Workspace",
      slug: (r.slug as string) ?? (r.id as string),
      ownerName: (nameById.get(r.owner_id) as string) ?? "—",
      ownerEmail: "",
      plan: (r.plan as Plan) ?? "none",
      status: (r.plan_status as PlanStatus) ?? "trialing",
      paused: false,
      messagesUsed: 0,
      kbPagesUsed: 0,
      signupAt: r.created_at as string,
      lastActiveAt: r.created_at as string,
      setupStatus: "live",
      setupFeePaid: r.plan_status === "active",
      trialEndsAt: (r.trial_ends_at as string) ?? null,
      unansweredCount: 0,
      notes: "",
    }));
  } catch {
    return [];
  }
}

export async function getClient(id: string): Promise<AdminClient | null> {
  const clients = await listClients();
  return clients.find((c) => c.id === id) ?? null;
}

// ---------- Command-center KPIs ----------

export interface PlatformKpis {
  totalClients: number;
  active: number;
  trialing: number;
  pastDue: number;
  paused: number;
  mrr: number;
  arr: number;
  signupsThisWeek: number;
  trialsEndingSoon: number;
  churnThisMonth: number;
  totalMessages: number;
  totalKbPages: number;
  estAiCostAud: number;
}

export async function getPlatformKpis(): Promise<PlatformKpis> {
  const clients = await listClients();
  const mrr = clients.reduce((s, c) => s + mrrForClient(c), 0);
  const totalMessages = clients.reduce((s, c) => s + c.messagesUsed, 0);
  return {
    totalClients: clients.length,
    active: clients.filter((c) => c.status === "active" && !c.paused).length,
    trialing: clients.filter((c) => c.status === "trialing").length,
    pastDue: clients.filter((c) => c.status === "past_due").length,
    paused: clients.filter((c) => c.paused).length,
    mrr,
    arr: mrr * 12,
    signupsThisWeek: clients.filter(
      (c) => (daysUntil(c.signupAt) ?? -999) > -7,
    ).length,
    trialsEndingSoon: clients.filter((c) => {
      const d = daysUntil(c.trialEndsAt);
      return d != null && d >= 0 && d <= 3;
    }).length,
    churnThisMonth: clients.filter((c) => c.status === "canceled").length,
    totalMessages,
    totalKbPages: clients.reduce((s, c) => s + c.kbPagesUsed, 0),
    // Rough estimate: Haiku is cheap — a few $ per 100k messages.
    estAiCostAud: Math.round((totalMessages / 1000) * 0.4 * 100) / 100,
  };
}

// ---------- Attention queue ----------

export type AttentionSeverity = "high" | "medium" | "low";
export interface AttentionItem {
  id: string;
  kind: string;
  label: string;
  clientId: string | null;
  clientName: string | null;
  href: string;
  severity: AttentionSeverity;
}

export async function getAttentionQueue(): Promise<AttentionItem[]> {
  const clients = await listClients();
  const items: AttentionItem[] = [];
  const link = (c: AdminClient) => `/admin/clients/${c.id}`;

  for (const c of clients) {
    const d = daysUntil(c.trialEndsAt);
    if (d != null && d >= 0 && d <= 3) {
      items.push({
        id: `trial_${c.id}`,
        kind: "Trial ending",
        label: `${c.name} — trial ends in ${d} day${d === 1 ? "" : "s"}`,
        clientId: c.id,
        clientName: c.name,
        href: link(c),
        severity: "high",
      });
    }
    if (c.status === "past_due") {
      items.push({
        id: `pastdue_${c.id}`,
        kind: "Failed payment",
        label: `${c.name} — payment past due`,
        clientId: c.id,
        clientName: c.name,
        href: link(c),
        severity: "high",
      });
    }
    if (isOverLimit(c)) {
      items.push({
        id: `overlimit_${c.id}`,
        kind: "Over limit",
        label: `${c.name} — ${c.messagesUsed.toLocaleString()} / ${messagesCap(
          c.plan,
        ).toLocaleString()} messages`,
        clientId: c.id,
        clientName: c.name,
        href: link(c),
        severity: "medium",
      });
    }
    if (c.setupStatus !== "live") {
      items.push({
        id: `setup_${c.id}`,
        kind: "Setup pending",
        label: `${c.name} — setup ${c.setupStatus.replace("_", " ")}`,
        clientId: c.id,
        clientName: c.name,
        href: `/admin/service`,
        severity: c.setupStatus === "pending" ? "high" : "medium",
      });
    }
    if (c.unansweredCount >= 8) {
      items.push({
        id: `gaps_${c.id}`,
        kind: "Knowledge gaps",
        label: `${c.name} — ${c.unansweredCount} unanswered questions`,
        clientId: c.id,
        clientName: c.name,
        href: `/admin/quality`,
        severity: "medium",
      });
    }
  }

  // Update requests + performance calls due (mock only — no live table yet).
  if (!USE_SUPABASE) {
    for (const t of ADMIN_TICKETS.filter((t) => t.status !== "done")) {
      const c = clients.find((x) => x.id === t.clientId);
      items.push({
        id: `ticket_${t.id}`,
        kind: "Update request",
        label: `${c?.name ?? "Client"} — ${t.title}`,
        clientId: t.clientId,
        clientName: c?.name ?? null,
        href: "/admin/service",
        severity: "low",
      });
    }
    for (const call of ADMIN_CALLS.filter((c) => c.status === "due")) {
      const c = clients.find((x) => x.id === call.clientId);
      const overdue = (daysUntil(call.dueAt) ?? 0) < 0;
      items.push({
        id: `call_${call.id}`,
        kind: "Performance call",
        label: `${c?.name ?? "Client"} — call ${overdue ? "overdue" : "due"}`,
        clientId: call.clientId,
        clientName: c?.name ?? null,
        href: "/admin/service",
        severity: overdue ? "high" : "low",
      });
    }
  }

  const rank: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// ---------- Revenue ----------

export interface RevenueView {
  mrr: number;
  arr: number;
  byPlan: { plan: Plan; count: number; mrr: number }[];
  trialToPaid: number; // %
  churnCount: number;
  failedPayments: number;
}

export async function getRevenue(): Promise<RevenueView> {
  const clients = await listClients();
  const paidPlans: Plan[] = ["starter", "growth", "pro"];
  const byPlan = paidPlans.map((plan) => {
    const inPlan = clients.filter((c) => c.plan === plan);
    return {
      plan,
      count: inPlan.length,
      mrr: inPlan.reduce((s, c) => s + mrrForClient(c), 0),
    };
  });
  const mrr = byPlan.reduce((s, p) => s + p.mrr, 0);
  const converted = clients.filter(
    (c) => c.status === "active" && c.plan !== "none",
  ).length;
  const everTrialed = clients.length;
  return {
    mrr,
    arr: mrr * 12,
    byPlan,
    trialToPaid: everTrialed ? Math.round((converted / everTrialed) * 100) : 0,
    churnCount: clients.filter((c) => c.status === "canceled").length,
    failedPayments: clients.filter((c) => c.status === "past_due").length,
  };
}

// ---------- Service delivery (mock datasets) ----------

export function getOnboarding() {
  return ADMIN_ONBOARDING;
}
export function getTickets() {
  return ADMIN_TICKETS;
}
export function getCalls() {
  return ADMIN_CALLS;
}
export function getInvoices() {
  return ADMIN_INVOICES;
}
export function getKnowledgeGaps() {
  return ADMIN_KNOWLEDGE_GAPS;
}
export function getBroadcasts() {
  return ADMIN_BROADCASTS;
}
export function getStaffList() {
  return ADMIN_STAFF;
}

// ---------- Leads (cross-client) ----------

/** A lead with the owning client's name attached, for the platform-wide view. */
export interface AdminLead {
  id: string;
  workspaceId: string;
  clientName: string;
  name: string;
  email: string;
  phone: string;
  intent: string;
  status: LeadStatus;
  createdAt: string;
}

/**
 * Every lead captured across every client, newest first — the platform-wide
 * leads view in the staff portal.
 * LIVE: reads the `leads` table via the SERVICE ROLE (staff-only, bypasses RLS)
 * and joins workspace names. MOCK: the demo client's seeded leads.
 */
export async function listAllLeads(): Promise<AdminLead[]> {
  if (!USE_SUPABASE) {
    const nameById = new Map(ADMIN_CLIENTS.map((c) => [c.id, c.name]));
    return [...DEMO_LEADS]
      .map((l) => ({
        id: l.id,
        workspaceId: l.workspaceId,
        clientName: nameById.get(l.workspaceId) ?? "Client",
        name: l.name,
        email: l.email,
        phone: l.phone,
        intent: l.intent,
        status: l.status,
        createdAt: l.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  try {
    const admin = createAdminClient();
    const { data: leads } = await admin
      .from("leads")
      .select("id, workspace_id, name, email, phone, intent, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = leads ?? [];

    const wsIds = Array.from(
      new Set(rows.map((r) => r.workspace_id).filter(Boolean)),
    );
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, name")
      .in("id", wsIds.length ? wsIds : [""]);
    const nameById = new Map((ws ?? []).map((w) => [w.id, w.name]));

    return rows.map((r) => ({
      id: r.id as string,
      workspaceId: r.workspace_id as string,
      clientName: (nameById.get(r.workspace_id) as string) ?? "Workspace",
      name: (r.name as string) ?? "",
      email: (r.email as string) ?? "",
      phone: (r.phone as string) ?? "",
      intent: (r.intent as string) ?? "",
      status: (r.status as LeadStatus) ?? "new",
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}
