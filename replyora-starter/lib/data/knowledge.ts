import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";
import { getWorkspace } from "@/lib/data/workspace";
import { canAddKnowledge } from "@/lib/usage";
import { PLANS } from "@/lib/stripe/plans";

import { DEMO_KNOWLEDGE_SOURCES } from "./seed";
import type { KnowledgeSource, KnowledgeStatus, KnowledgeType } from "./types";

/** Thrown when adding a source would exceed the plan's knowledge-base limit. */
export class KnowledgeLimitError extends Error {}

interface SourceRow {
  id: string;
  workspace_id: string;
  type: string;
  title: string | null;
  status: string | null;
  error: string | null;
  metadata: unknown;
  created_at: string;
}

function mapSource(row: SourceRow): KnowledgeSource {
  const meta = (row.metadata ?? {}) as { preview?: string; sizeBytes?: number };
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: (row.type as KnowledgeType) ?? "text",
    title: row.title ?? "Untitled",
    preview: meta.preview ?? "",
    status: (row.status as KnowledgeStatus) ?? "ready",
    error: row.error,
    sizeBytes: meta.sizeBytes ?? 0,
    createdAt: row.created_at,
  };
}

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    // Read the process-global mock store so staff edits made in /admin
    // (edit-on-behalf) show up on the client's own dashboard. Falls back to the
    // seed for any workspace not in the store.
    const { mockState } = await import("@/lib/admin/mock-state");
    const list = mockState.kb[workspaceId] ?? DEMO_KNOWLEDGE_SOURCES;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("knowledge_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => mapSource(r as SourceRow));
  } catch {
    return [];
  }
}

export interface NewKnowledgeSource {
  type: KnowledgeType;
  title: string;
  preview: string;
  sizeBytes?: number;
}

/**
 * Create a knowledge source. In production this also enqueues ingestion
 * (extract → chunk → embed → store). // TODO: wire the ingestion job (Phase 3).
 */
export async function createKnowledgeSource(
  input: NewKnowledgeSource,
): Promise<KnowledgeSource> {
  const workspaceId = await getCurrentWorkspaceId();

  // Enforce the plan's KB size limit (internally in characters, ~1 page ≈ 2,500).
  const [workspace, existing] = await Promise.all([
    getWorkspace(),
    listKnowledgeSources(),
  ]);
  const usedChars = existing.reduce((sum, s) => sum + s.sizeBytes, 0);
  const addChars = input.sizeBytes ?? input.preview.length;
  if (!canAddKnowledge(workspace.plan, usedChars, addChars)) {
    const plan = PLANS[workspace.plan];
    throw new KnowledgeLimitError(
      `Your ${plan.name} plan includes about ${plan.kbPages} pages of knowledge. Remove a source or upgrade to add more.`,
    );
  }

  const base: KnowledgeSource = {
    id: `ks_${Math.random().toString(36).slice(2, 10)}`,
    workspaceId,
    type: input.type,
    title: input.title,
    preview: input.preview,
    status: "processing",
    error: null,
    sizeBytes: input.sizeBytes ?? input.preview.length,
    createdAt: new Date().toISOString(),
  };
  if (!USE_SUPABASE) {
    const { mockKb } = await import("@/lib/admin/mock-state");
    mockKb(workspaceId).unshift(base);
    return base;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_sources")
    .insert({
      workspace_id: workspaceId,
      type: input.type,
      title: input.title,
      status: "processing",
      metadata: { preview: input.preview, sizeBytes: base.sizeBytes },
    })
    .select("*")
    .maybeSingle();
  return data ? mapSource(data as SourceRow) : base;
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) {
    const { mockKb } = await import("@/lib/admin/mock-state");
    const arr = mockKb(workspaceId);
    const i = arr.findIndex((s) => s.id === id);
    if (i >= 0) arr.splice(i, 1);
    return;
  }
  const supabase = await createClient();
  await supabase
    .from("knowledge_sources")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
}
