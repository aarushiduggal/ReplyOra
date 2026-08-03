import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { DEMO_BUSINESS_PROFILE } from "@/lib/data/seed";
import { mockKb } from "@/lib/admin/mock-state";
import type {
  BusinessProfile,
  KnowledgeSource,
  KnowledgeType,
} from "@/lib/data/types";

/**
 * Low-level cross-client read/write for the staff portal (edit-on-behalf).
 * LIVE: uses the SERVICE ROLE, hard-scoped to the target workspace_id.
 * MOCK: shares the demo client's arrays so an admin edit is immediately visible
 * on that client's own dashboard (proves propagation). Other mock clients get
 * their own in-memory arrays.
 *
 * Audit + access control live in lib/admin/actions.ts — never call these raw
 * from a client component.
 */

interface KnowledgeRow {
  id: string;
  workspace_id: string;
  type: string;
  title: string | null;
  status: string | null;
  error: string | null;
  metadata: unknown;
  created_at: string;
}
function mapKb(row: KnowledgeRow): KnowledgeSource {
  const meta = (row.metadata ?? {}) as { preview?: string; sizeBytes?: number };
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: (row.type as KnowledgeType) ?? "text",
    title: row.title ?? "Untitled",
    preview: meta.preview ?? "",
    status: (row.status as KnowledgeSource["status"]) ?? "ready",
    error: row.error,
    sizeBytes: meta.sizeBytes ?? 0,
    createdAt: row.created_at,
  };
}

export async function adminListKnowledge(
  workspaceId: string,
): Promise<KnowledgeSource[]> {
  if (!USE_SUPABASE) {
    return [...mockKb(workspaceId)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("knowledge_sources")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapKb(r as KnowledgeRow));
}

export async function adminInsertKnowledge(
  workspaceId: string,
  input: { type: KnowledgeType; title: string; preview: string },
): Promise<KnowledgeSource> {
  const source: KnowledgeSource = {
    id: `ks_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId,
    type: input.type,
    title: input.title,
    preview: input.preview,
    status: "ready",
    error: null,
    sizeBytes: input.preview.length,
    createdAt: new Date().toISOString(),
  };
  if (!USE_SUPABASE) {
    mockKb(workspaceId).unshift(source);
    return source;
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("knowledge_sources")
    .insert({
      workspace_id: workspaceId,
      type: input.type,
      title: input.title,
      status: "ready",
      metadata: { preview: input.preview, sizeBytes: source.sizeBytes },
    })
    .select("*")
    .maybeSingle();
  return data ? mapKb(data as KnowledgeRow) : source;
}

export async function adminDeleteKnowledge(
  workspaceId: string,
  sourceId: string,
): Promise<void> {
  if (!USE_SUPABASE) {
    const arr = mockKb(workspaceId);
    const i = arr.findIndex((s) => s.id === sourceId);
    if (i >= 0) arr.splice(i, 1);
    return;
  }
  const admin = createAdminClient();
  await admin
    .from("knowledge_sources")
    .delete()
    .eq("id", sourceId)
    .eq("workspace_id", workspaceId);
}

// ---------- Business profile ----------

const MOCK_PROFILES: Record<string, BusinessProfile> = {
  ws_demo: DEMO_BUSINESS_PROFILE,
};

export async function adminGetBusinessProfile(
  workspaceId: string,
): Promise<Partial<BusinessProfile>> {
  if (!USE_SUPABASE) {
    return MOCK_PROFILES[workspaceId] ?? { workspaceId, industry: "", description: "", website: "", phone: "", email: "", address: "" };
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("business_profiles")
    .select("industry, description, website, phone, email, address")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return (data ?? {}) as Partial<BusinessProfile>;
}

export async function adminSaveBusinessProfile(
  workspaceId: string,
  patch: Partial<BusinessProfile>,
): Promise<void> {
  if (!USE_SUPABASE) {
    const current = MOCK_PROFILES[workspaceId];
    if (current) Object.assign(current, patch);
    return;
  }
  const admin = createAdminClient();
  await admin
    .from("business_profiles")
    .update(patch)
    .eq("workspace_id", workspaceId);
}
