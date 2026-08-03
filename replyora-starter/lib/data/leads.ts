import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import { DEMO_LEADS } from "./seed";
import type { Lead, LeadScore, LeadStatus } from "./types";

interface LeadRow {
  id: string;
  workspace_id: string;
  conversation_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  intent: string | null;
  status: string | null;
  created_at: string;
}

// Note: score/qualification aren't columns in 0001_init yet, so live mode
// defaults them. // TODO: add a migration for lead scoring.
function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    intent: row.intent ?? "",
    status: (row.status as LeadStatus) ?? "new",
    score: "warm" as LeadScore,
    scoreValue: 50,
    qualification: { service: null, urgency: null, suburb: null, budget: null },
    createdAt: row.created_at,
  };
}

export async function listLeads(): Promise<Lead[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    return [...DEMO_LEADS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => mapLead(r as LeadRow));
  } catch {
    return [];
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    const lead = DEMO_LEADS.find((l) => l.id === id);
    return lead ? { ...lead, status } : null;
  }
  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  return null;
}
